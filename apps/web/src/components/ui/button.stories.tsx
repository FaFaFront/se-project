import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: "Button", variant: "default" },
};

export const Secondary: Story = {
  args: { children: "Button", variant: "secondary" },
};

export const Outline: Story = {
  args: { children: "Button", variant: "outline" },
};
