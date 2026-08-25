import type { Meta, StoryObj } from "@storybook/react";
import { PasswordForm } from "./password-form";

const meta: Meta<typeof PasswordForm> = {
  title: "UI/PasswordForm",
  component: PasswordForm,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "radio", options: ["desktop", "mobile"] },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordForm>;

export const Default: Story = {
  args: {
    size: "desktop",
  },
};

export const Focus: Story = {
  args: {
    size: "desktop",
    autoFocus: true,
  },
};

export const Filled: Story = {
  args: {
    size: "desktop",
    value: "password1234",
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    size: "desktop",
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    size: "desktop",
    error: true,
    value: "password1234",
    onChange: () => {},
  },
};

export const DefaultMobile: Story = {
  args: {
    size: "mobile",
  },
};

export const FilledMobile: Story = {
  args: {
    size: "mobile",
    value: "password1234",
    onChange: () => {},
  },
};

export const DisabledMobile: Story = {
  args: {
    size: "mobile",
    disabled: true,
  },
};

export const ErrorMobile: Story = {
  args: {
    size: "mobile",
    error: true,
    value: "password1234",
    onChange: () => {},
  },
};
