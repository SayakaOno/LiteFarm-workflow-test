/*
 *  Copyright 2023 LiteFarm.org
 *  This file is part of LiteFarm.
 *
 *  LiteFarm is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  LiteFarm is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details, see <https://www.gnu.org/licenses/>.
 */
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { within, userEvent, waitFor, screen } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import selectEvent from 'react-select-event';
import DateRangeSelector from '../../components/DateRangeSelector';
import { componentDecorators } from '../Pages/config/Decorators';
import { dateRangeOptions } from '../../components/DateRangeSelector/constants';
import { FROM_DATE, TO_DATE } from '../../components/Form/DateRangePicker';

export default {
  title: 'Components/DateRangeSelector',
  component: DateRangeSelector,
  decorators: componentDecorators,
};

const useFormMethods = () => {
  const {
    register,
    watch,
    setValue,
    getValues,
    setError,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
  });

  return {
    register,
    watch,
    setValue,
    getValues,
    setError,
    control,
    handleSubmit,
    formState: { errors, isValid },
  };
};

export const WithPlaceholder = {
  render: () => {
    const formMethods = useFormMethods();

    return <DateRangeSelector {...formMethods} placeholder="Select Date Range" />;
  },
};

export const WithDefaultOption = {
  render: () => {
    const formMethods = useFormMethods();

    return (
      <Suspense fallback={'Loading...'}>
        <DateRangeSelector
          {...formMethods}
          defaultDateRangeOptionValue={dateRangeOptions.THIS_YEAR}
        />
      </Suspense>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    let selectedOptionText = await canvas.findByText('This year');
    expect(selectedOptionText).toBeInTheDocument();

    const select = canvas.getByRole('combobox');
    await selectEvent.openMenu(select);

    let option = screen.getByText('Last 7 days');
    await userEvent.click(option);

    await selectEvent.openMenu(select);
    option = screen.getAllByText('Last 7 days')[1];
    expect(option).toHaveStyle('font-weight: 700');

    option = screen.getByText('Pick a custom range');
    await userEvent.click(option);

    const backButton = await canvas.findByText('back');
    expect(backButton).toBeInTheDocument();

    await userEvent.click(backButton);
    expect(backButton).toBeInTheDocument();

    selectedOptionText = canvas.getByText('yyyy-mm-dd - yyyy-mm-dd');
    expect(selectedOptionText).toBeInTheDocument();

    const [input1, input2] = canvas.getAllByTestId('input');
    await userEvent.clear(input1);
    await userEvent.clear(input2);

    await userEvent.type(input1, '2023-11-01');
    expect(selectedOptionText).toBeInTheDocument();

    await userEvent.type(input2, '2022-11-01');
    expect(selectedOptionText).toBeInTheDocument();

    let errorMessage = await canvas.findByText(`'To' date must come after the 'From' date`);
    expect(errorMessage).toBeInTheDocument();

    // if the user clicks outside the selector while entered custom data range is invalid,
    // selected option should be reset to "This year"
    // test fails with test-runner
    // await userEvent.click(document.body);
    // await waitFor(() => (selectedOptionText = canvas.getByText('This year')));
    // expect(selectedOptionText).toBeInTheDocument();
  },
};

export const WithDefaultCustomDateRange = {
  render: () => {
    const formMethods = useFormMethods();

    return (
      <Suspense fallback={'Loading...'}>
        <DateRangeSelector
          {...formMethods}
          defaultDateRangeOptionValue={dateRangeOptions.CUSTOM}
          defaultCustomDateRange={{ [FROM_DATE]: '2023-01-01', [TO_DATE]: '2024-01-01' }}
        />
      </Suspense>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    let selectedOptionText = await canvas.findByText('2023-01-01 - 2024-01-01');
    expect(selectedOptionText).toBeInTheDocument();

    const select = canvas.getByRole('combobox');
    await selectEvent.openMenu(select);

    // test fails without these 5 lines
    let option = screen.getByText('Last 7 days');
    await userEvent.click(option);
    await selectEvent.openMenu(select);
    option = screen.getAllByText('Last 7 days')[1];
    expect(option).toHaveStyle('font-weight: 700');

    option = screen.getByText('Pick a custom range');
    await userEvent.click(option);

    const [input1, input2] = await canvas.findAllByTestId('input');
    await userEvent.clear(input1);
    await userEvent.clear(input2);

    selectedOptionText = canvas.getByText('yyyy-mm-dd - yyyy-mm-dd');

    await userEvent.type(input1, '2021-01-01');
    expect(selectedOptionText).toBeInTheDocument();

    await userEvent.type(input2, '2023-12-31');

    selectedOptionText = await canvas.findByText('2021-01-01 - 2023-12-31');
    expect(selectedOptionText).toBeInTheDocument();

    const clearButton = canvas.getByText('Clear dates');
    await userEvent.click(clearButton);

    const errorMessage = canvas.queryByText(`'To' date must come after the 'From' date`);
    expect(errorMessage).not.toBeInTheDocument();

    await userEvent.clear(input1);
    await userEvent.clear(input2);
    await userEvent.type(input1, '2023-01-01');
    await userEvent.type(input2, '2024-01-01');

    selectedOptionText = await canvas.findByText('2023-01-01 - 2024-01-01');
    expect(selectedOptionText).toBeInTheDocument();

    const backButton = await canvas.findByText('back');
    expect(backButton).toBeInTheDocument();

    await userEvent.click(backButton);
    option = await screen.findByText('Pick a custom range');
    expect(option).toHaveStyle('font-weight: 700');

    await userEvent.click(document.body);
    expect(selectedOptionText).toBeInTheDocument();
  },
};
