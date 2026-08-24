import { Fragment, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MultiSelect } from "@/components/ui/MultiSelect";

const options = ["หมวดหมู่ 1", "หมวดหมู่ 2", "หมวดหมู่ 3", "หมวดหมู่ 4"];

const meta = {
  title: "UI/MultiSelect",
  component: MultiSelect,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "หมวดหมู่",
    placeholder: "เลือกหมวดหมู่",
    options,
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelectedValues: Story = {
  args: {
    defaultValue: ["หมวดหมู่ 1", "หมวดหมู่ 2"],
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
    defaultValue: ["หมวดหมู่ 1"],
  },
};

export const WithError: Story = {
  args: {
    defaultValue: ["หมวดหมู่ 1", "หมวดหมู่ 2"],
    error: true,
    errorMessage: "เกิดข้อผิดพลาด",
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
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
          />
        ),
        mobile: (
          <MultiSelect
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
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
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
            disabled
          />
        ),
        mobile: (
          <MultiSelect
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
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
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
            defaultOpen
          />
        ),
        mobile: (
          <MultiSelect
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
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
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
            defaultValue={["หมวดหมู่ 1", "หมวดหมู่ 2"]}
            defaultOpen
          />
        ),
        mobile: (
          <MultiSelect
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
            options={options}
            className="w-[200px]"
            triggerClassName={mobileSize}
            defaultValue={["หมวดหมู่ 1", "หมวดหมู่ 2"]}
            defaultOpen
          />
        ),
      },
      {
        label: "Error",
        desktop: (
          <MultiSelect
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
            options={options}
            className="w-[200px]"
            triggerClassName={desktopSize}
            defaultValue={["หมวดหมู่ 1", "หมวดหมู่ 2"]}
            error
            errorMessage="เกิดข้อผิดพลาด"
          />
        ),
        mobile: (
          <MultiSelect
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
            options={options}
            className="w-[200px]"
            triggerClassName={mobileSize}
            defaultValue={["หมวดหมู่ 1", "หมวดหมู่ 2"]}
            error
            errorMessage="เกิดข้อผิดพลาด"
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
            <div className="text-foreground-secondary pt-2 text-sm">{row.label}</div>
            <div>{row.desktop}</div>
            <div>{row.mobile}</div>
          </Fragment>
        ))}
      </div>
    );
  },
};
