import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./select";

const options = ["Option 1", "Option 2", "Option 3", "Option 4"];

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    label: "Faculty",
    placeholder: "Select faculty",
    options,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const Open: Story = { args: { defaultOpen: true } };

export const Selected: Story = { args: { defaultValue: "Option 1" } };

export const Error: Story = {
  args: { defaultValue: "Option 1", error: true, errorMessage: "Something went wrong" },
};
