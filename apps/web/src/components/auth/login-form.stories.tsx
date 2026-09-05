import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginForm } from "./login-form";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const meta = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Login form for the email/password flow. Field errors are validated on submit; " +
          "credential failures surface as a single form-level message so the UI never " +
          "reveals whether the email or the password was wrong. Press **Log in** in each " +
          "story to see the state it demonstrates.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    onSubmit: async () => delay(600),
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Happy path — resolves after a short delay, as a successful login would. */
export const Default: Story = {};

/** Submit with both fields empty to see the per-field required messages. */
export const ValidationErrors: Story = {};

/** Submit anything to see the loading state; the promise never settles. */
export const Submitting: Story = {
  args: {
    onSubmit: () => new Promise<void>(() => {}),
  },
};

/**
 * What a 401 looks like. The API answers a wrong password and an unknown email
 * with this same message, so the form cannot distinguish the two either.
 */
export const InvalidCredentials: Story = {
  args: {
    onSubmit: async () => {
      await delay(600);
      throw new Error("Invalid email or password");
    },
  },
};

/** A fetch-level failure (API down, no network) rather than a rejected login. */
export const ServerUnreachable: Story = {
  args: {
    onSubmit: async () => {
      await delay(600);
      throw new TypeError("Failed to fetch");
    },
  },
};
