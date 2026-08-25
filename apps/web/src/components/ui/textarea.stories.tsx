import { Fragment, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Description",
    placeholder: "Enter description",
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    defaultValue: "Enter description",
    error: true,
    errorMessage: "Something went wrong",
  },
};

export const AllStates: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => {
    const desktopSize = "text-base leading-[26px] md:text-base md:leading-[26px]";
    const mobileSize = "text-sm leading-[23px] md:text-sm md:leading-[23px]";

    const rows: { label: string; desktop: ReactNode; mobile: ReactNode }[] = [
      {
        label: "Default",
        desktop: (
          <Textarea
            label="Description"
            placeholder="Enter description"
            wrapperClassName="w-[420px]"
            className={desktopSize}
          />
        ),
        mobile: (
          <Textarea
            label="Description"
            placeholder="Enter description"
            wrapperClassName="w-[420px]"
            className={mobileSize}
          />
        ),
      },
      {
        label: "Hover",
        desktop: (
          <Textarea
            label="Description"
            placeholder="Enter description"
            wrapperClassName="w-[420px]"
            className={cn(desktopSize, "border-primary")}
          />
        ),
        mobile: (
          <Textarea
            label="Description"
            placeholder="Enter description"
            wrapperClassName="w-[420px]"
            className={cn(mobileSize, "border-primary")}
          />
        ),
      },
      {
        label: "Focus",
        desktop: (
          <Textarea
            label="Description"
            placeholder="Enter description"
            wrapperClassName="w-[420px]"
            className={cn(desktopSize, "border-primary")}
          />
        ),
        mobile: (
          <Textarea
            label="Description"
            placeholder="Enter description"
            wrapperClassName="w-[420px]"
            className={cn(mobileSize, "border-primary")}
          />
        ),
      },
      {
        label: "Disable",
        desktop: (
          <Textarea
            label="Description"
            placeholder="Enter description"
            wrapperClassName="w-[420px]"
            className={desktopSize}
            disabled
          />
        ),
        mobile: (
          <Textarea
            label="Description"
            placeholder="Enter description"
            wrapperClassName="w-[420px]"
            className={mobileSize}
            disabled
          />
        ),
      },
      {
        label: "Error",
        desktop: (
          <Textarea
            label="Description"
            defaultValue="Enter description"
            wrapperClassName="w-[420px]"
            className={desktopSize}
            error
            errorMessage="Something went wrong"
          />
        ),
        mobile: (
          <Textarea
            label="Description"
            defaultValue="Enter description"
            wrapperClassName="w-[420px]"
            className={mobileSize}
            error
            errorMessage="Something went wrong"
          />
        ),
      },
    ];

    return (
      <div className="grid grid-cols-[80px_420px_420px] items-start gap-x-16 gap-y-10 p-10">
        <div />
        <div className="font-inter text-center text-xl font-semibold">Desktop</div>
        <div className="font-inter text-center text-xl font-semibold">Mobile</div>

        {rows.map((row) => (
          <Fragment key={row.label}>
            <div className="font-inter text-ink pt-2 text-sm">{row.label}</div>
            <div>{row.desktop}</div>
            <div>{row.mobile}</div>
          </Fragment>
        ))}
      </div>
    );
  },
};
