import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "I have read and accept the Privacy Policy",
    wrapperClassName: "w-[min(520px,calc(100vw-32px))]",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithError: Story = {
  args: {
    error: true,
    errorMessage: "You must accept the Privacy Policy to sign up",
  },
};
