import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { cn } from "@/lib/utils";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["primary", "outline"],
    },
    isLoading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    children: "Button",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

export const PrimaryLoading: Story = {
  args: {
    variant: "primary",
    isLoading: true,
  },
};

export const OutlineLoading: Story = {
  args: {
    variant: "outline",
    isLoading: true,
  },
};

export const PrimaryDisabled: Story = {
  args: {
    variant: "primary",
    disabled: true,
  },
};

export const OutlineDisabled: Story = {
  args: {
    variant: "outline",
    disabled: true,
  },
};

export const AllStates: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => {
    const desktopSize = "text-base leading-[26px] md:text-base md:leading-[26px]";
    const mobileSize = "text-sm leading-[23px] md:text-sm md:leading-[23px]";

    const rows: {
      label: string;
      props: Partial<{ isLoading: boolean; disabled: boolean }>;
      hoverFake?: boolean;
    }[] = [
      { label: "Default", props: {} },
      { label: "Hover", props: {}, hoverFake: true },
      { label: "Loading", props: { isLoading: true } },
      { label: "Disable", props: { disabled: true } },
    ];

    const cell = (
      variant: "primary" | "outline",
      size: string,
      props: Partial<{ isLoading: boolean; disabled: boolean }>,
      hoverFake?: boolean
    ) => (
      <Button
        variant={variant}
        {...props}
        className={cn(
          size,
          props.isLoading && "w-[100px]",
          hoverFake && variant === "primary" && "bg-primary/[0.8]",
          hoverFake && variant === "outline" && "bg-ink-black/[0.07]"
        )}
      >
        Button
      </Button>
    );

    return (
      <div className="grid grid-cols-[80px_repeat(4,140px)] items-center gap-x-8 gap-y-6 p-10">
        <div />
        <div className="col-span-2 text-center text-xl font-semibold">Desktop</div>
        <div className="col-span-2 text-center text-xl font-semibold">Mobile</div>

        <div />
        <div className="text-foreground-muted text-center text-sm">Primary</div>
        <div className="text-foreground-muted text-center text-sm">Outline</div>
        <div className="text-foreground-muted text-center text-sm">Primary</div>
        <div className="text-foreground-muted text-center text-sm">Outline</div>

        {rows.map((row) => (
          <Fragment key={row.label}>
            <div className="text-foreground-muted text-sm">{row.label}</div>
            <div className="flex justify-center">
              {cell("primary", desktopSize, row.props, row.hoverFake)}
            </div>
            <div className="flex justify-center">
              {cell("outline", desktopSize, row.props, row.hoverFake)}
            </div>
            <div className="flex justify-center">
              {cell("primary", mobileSize, row.props, row.hoverFake)}
            </div>
            <div className="flex justify-center">
              {cell("outline", mobileSize, row.props, row.hoverFake)}
            </div>
          </Fragment>
        ))}
      </div>
    );
  },
};