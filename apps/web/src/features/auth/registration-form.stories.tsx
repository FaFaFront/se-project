import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { RegistrationForm } from "./registration-form";

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function fillForm(
  canvasElement: HTMLElement,
  values: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {}
) {
  const canvas = within(canvasElement);

  await userEvent.type(
    canvas.getByRole("textbox", { name: "Gmail" }),
    values.email ?? "user@gmail.com"
  );
  await userEvent.type(canvas.getByLabelText("Password"), values.password ?? "password");
  await userEvent.type(
    canvas.getByLabelText("Confirm password"),
    values.confirmPassword ?? "password"
  );

  return canvas;
}

const meta = {
  title: "Auth/RegistrationForm",
  component: RegistrationForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Frontend-only student and tutor registration form. Each validation and submission " +
          "story runs its interaction automatically when opened.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    onSubmit: async () => delay(400),
  },
} satisfies Meta<typeof RegistrationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Student: Story = {};

export const Tutor: Story = {
  args: {
    defaultRole: "tutor",
  },
};

export const RoleSwitchPreservesFields: Story = {
  args: {
    onSubmit: fn(async () => undefined),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = await fillForm(canvasElement);
    const email = canvas.getByRole("textbox", { name: "Gmail" });
    const password = canvas.getByLabelText("Password");
    const confirmPassword = canvas.getByLabelText("Confirm password");

    await userEvent.click(canvas.getByRole("combobox", { name: "Signing up as" }));
    await userEvent.click(canvas.getByRole("option", { name: "Tutor" }));

    await expect(canvas.getByRole("combobox", { name: "Signing up as" })).toHaveTextContent(
      "Tutor"
    );
    await expect(email).toHaveValue("user@gmail.com");
    await expect(password).toHaveValue("password");
    await expect(confirmPassword).toHaveValue("password");

    await userEvent.click(canvas.getByRole("combobox", { name: "Signing up as" }));
    await userEvent.click(canvas.getByRole("option", { name: "Student" }));

    await expect(canvas.getByRole("combobox", { name: "Signing up as" })).toHaveTextContent(
      "Student"
    );
    await expect(email).toHaveValue("user@gmail.com");
    await expect(password).toHaveValue("password");
    await expect(confirmPassword).toHaveValue("password");

    await userEvent.click(canvas.getByRole("button", { name: "Sign up" }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      role: "student",
      email: "user@gmail.com",
      password: "password",
      confirmPassword: "password",
    });
  },
};

export const EmptyFieldErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Sign up" }));

    await expect(canvas.getByText("Gmail is required")).toBeVisible();
    await expect(canvas.getByText("Password is required")).toBeVisible();
    await expect(canvas.getByText("Please confirm your password")).toBeVisible();
  },
};

export const InvalidGmail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await fillForm(canvasElement, { email: "user@example.com" });
    await userEvent.click(canvas.getByRole("button", { name: "Sign up" }));

    await expect(canvas.getByText("Please enter a valid Gmail address")).toBeVisible();
  },
};

export const ShortPassword: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await fillForm(canvasElement, {
      password: "short",
      confirmPassword: "short",
    });
    await userEvent.click(canvas.getByRole("button", { name: "Sign up" }));

    await expect(canvas.getByText("Password must be at least 8 characters")).toBeVisible();
  },
};

export const MismatchedConfirmation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await fillForm(canvasElement, { confirmPassword: "different" });
    await userEvent.click(canvas.getByRole("button", { name: "Sign up" }));

    await expect(canvas.getByText("Passwords do not match")).toBeVisible();
  },
};

export const Submitting: Story = {
  args: {
    onSubmit: () => new Promise<void>(() => undefined),
  },
  play: async ({ canvasElement }) => {
    const canvas = await fillForm(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Sign up" }));

    await expect(canvas.getByRole("button", { name: "Sign up" })).toHaveAttribute(
      "aria-busy",
      "true"
    );
    await expect(canvas.getByRole("combobox", { name: "Signing up as" })).toBeDisabled();
  },
};

export const GenericRejection: Story = {
  args: {
    onSubmit: async () => {
      throw new Error();
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await fillForm(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Sign up" }));

    await expect(canvas.findByText("Unable to sign up. Please try again.")).resolves.toBeVisible();
  },
};

export const NetworkRejection: Story = {
  args: {
    onSubmit: async () => {
      throw new TypeError("Failed to fetch");
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await fillForm(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Sign up" }));

    await expect(
      canvas.findByText("Unable to reach the server. Please try again.")
    ).resolves.toBeVisible();
  },
};
