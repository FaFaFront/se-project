import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./select";

const options = ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"];

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    label: "คณะ",
    placeholder: "เลือกคณะ",
    options,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const Open: Story = { args: { defaultOpen: true } };

export const Selected: Story = { args: { defaultValue: "ตัวเลือก 1" } };

export const Error: Story = {
  args: { defaultValue: "ตัวเลือก 1", error: true, errorMessage: "เกิดข้อผิดพลาด" },
};
