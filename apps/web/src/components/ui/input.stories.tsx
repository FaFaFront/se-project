import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "อีเมล",
    placeholder: "example@gmail.com",
    type: "email",
    wrapperClassName: "w-[min(520px,calc(100vw-32px))]",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  args: {
    className: "border-primary",
  },
};

export const Focus: Story = {
  args: {
    autoFocus: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    defaultValue: "example@gmail.com",
    error: true,
    errorMessage: "เกิดข้อผิดพลาด",
  },
};
