import { Fragment, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MultiSelect } from "@/components/ui/multi-select";

const options = ["Category 1", "Category 2", "Category 3", "Category 4"];

const meta = {
  title: "UI/MultiSelect",
  component: MultiSelect,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Category",
    placeholder: "Select category",
    options,
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelectedValues: Story = {
  args: {
    defaultValue: ["Category 1", "Category 2"],
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledOpen: Story = {
  args: {
    disabled: true,
    defaultOpen: true,
    defaultValue: ["Category 1"],
  },
};

export const WithError: Story = {
  args: {
    defaultValue: ["Category 1", "Category 2"],
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
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
          />
        ),
        mobile: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={mobileSize}
          />
        ),
      },
      {
        label: "Disable",
        desktop: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
            disabled
          />
        ),
        mobile: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={mobileSize}
            disabled
          />
        ),
      },
      {
        label: "Hover Option",
        desktop: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
            defaultOpen
          />
        ),
        mobile: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={mobileSize}
            defaultOpen
          />
        ),
      },
      {
        label: "Select Option",
        desktop: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
            defaultValue={["Category 1", "Category 2"]}
            defaultOpen
          />
        ),
        mobile: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={mobileSize}
            defaultValue={["Category 1", "Category 2"]}
            defaultOpen
          />
        ),
      },
      {
        label: "Error",
        desktop: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
            defaultValue={["Category 1", "Category 2"]}
            error
            errorMessage="Something went wrong"
          />
        ),
        mobile: (
          <MultiSelect
            label="Category"
            placeholder="Select category"
            options={options}
            className="w-[200px]"
            triggerClassName={mobileSize}
            defaultValue={["Category 1", "Category 2"]}
            error
            errorMessage="Something went wrong"
          />
        ),
      },
    ];

    return (
      <div className="grid grid-cols-[80px_200px_200px] items-start gap-x-16 gap-y-10 p-10">
        <div />
        <div className="text-center text-xl font-semibold">Desktop</div>
        <div className="text-center text-xl font-semibold">Mobile</div>

        {rows.map((row) => (
          <Fragment key={row.label}>
            <div className="text-ink-black/60 pt-2 text-sm">{row.label}</div>
            <div>{row.desktop}</div>
            <div>{row.mobile}</div>
          </Fragment>
        ))}
      </div>
    );
  },
};
