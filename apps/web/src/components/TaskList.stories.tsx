import type { Meta, StoryObj } from "@storybook/react";
import { TaskList } from "./TaskList";

const meta: Meta<typeof TaskList> = {
  title: "TaskList",
  component: TaskList,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        push: () => {},
        replace: () => {},
        refresh: () => {},
        back: () => {},
        forward: () => {},
        prefetch: () => {},
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskList>;

export const WithTasks: Story = {
  args: {
    tasks: [
      { id: "1", title: "Set up the project", done: true, createdAt: new Date().toISOString() },
      { id: "2", title: "Read the docs", done: false, createdAt: new Date().toISOString() },
    ],
  },
};

export const Empty: Story = {
  args: { tasks: [] },
};
