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
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import clsx from 'clsx';
import { ClickAwayListener } from '@mui/material';
import { ReactComponent as Calendar } from '../../assets/images/dateInput/calendar.svg';
import CustomDateRangeSelector from './CustomDateRangeSelector';
import ReactSelect from '../Form/ReactSelect';
import { FROM_DATE, TO_DATE } from '../Form/DateRangePicker';
import { getLocalDateInYYYYDDMM, addDaysToDate } from '../../util/date';
import { DATE_RANGE, dateRangeOptions as rangeOptions } from './constants';
import styles from './styles.module.scss';

/**
 * Returns fromDate max value (the previous day of customToDate)
 * and toDate min value (the next day of customFromDate).
 *
 * @typedef {object} minMaxDates
 * @property {string} fromDateMax - date in YYYY-MM-DD format
 * @property {string} toDateMin - date in YYYY-MM-DD format
 *
 * @param {string} customFromDate - date in YYYY-MM-DD format
 * @param {string} customToDate - date in YYYY-MM-DD format
 * @returns {minMaxDates}
 */
const getMinMaxDates = (customFromDate, customToDate) => {
  // convert YYYY-MM-DD to Date() format
  const [fromDate, toDate] = [customFromDate, customToDate].map((date) => {
    if (!date) {
      return undefined;
    }
    const [year, month, day] = date.split('-');
    return new Date(+year, +month - 1, +day);
  });

  return {
    fromDateMax: toDate && getLocalDateInYYYYDDMM(addDaysToDate(new Date(toDate), -1)),
    toDateMin: fromDate && getLocalDateInYYYYDDMM(addDaysToDate(new Date(fromDate), 1)),
  };
};

export default function DateRangeSelector({
  register,
  watch,
  setValue,
  getValues,
  formState: { isValid },
  control,
  defaultDateRangeOptionValue,
  defaultCustomDateRange = {},
  placeholder,
}) {
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);

  const { t } = useTranslation();
  const selectRef = useRef(null);

  const customFromDate = watch(FROM_DATE);
  const customToDate = watch(TO_DATE);
  const selectedDateRangeOption = watch(DATE_RANGE);

  const options = [
    { value: rangeOptions.THIS_YEAR, label: t('DATE_RANGE_SELECTOR.THIS_YEAR') },
    { value: rangeOptions.LAST_7_DAYS, label: t('DATE_RANGE_SELECTOR.LAST_SEVEN_DAYS') },
    { value: rangeOptions.LAST_14_DAYS, label: t('DATE_RANGE_SELECTOR.LAST_FOURTEEN_DAYS') },
    { value: rangeOptions.LAST_30_DAYS, label: t('DATE_RANGE_SELECTOR.LAST_THIRTY_DAYS') },
    { value: rangeOptions.THIS_WEEK, label: t('DATE_RANGE_SELECTOR.THIS_WEEK') },
    { value: rangeOptions.LAST_WEEK, label: t('DATE_RANGE_SELECTOR.LAST_WEEK') },
    { value: rangeOptions.THIS_MONTH, label: t('DATE_RANGE_SELECTOR.THIS_MONTH') },
    { value: rangeOptions.LAST_MONTH, label: t('DATE_RANGE_SELECTOR.LAST_MONTH') },
    { value: rangeOptions.CUSTOM, label: t('DATE_RANGE_SELECTOR.CUSTOM_RANGE') },
  ];

  // set defaultCustomDateRange if exists
  useEffect(() => {
    if (defaultDateRangeOptionValue !== rangeOptions.CUSTOM) {
      return;
    }
    const { [FROM_DATE]: defaultFromDate, [TO_DATE]: defaultToDate } = defaultCustomDateRange;

    // if the range does not have both FROM_DATE and TO_DATE, reset the option to "this year"
    if (!defaultFromDate || !defaultToDate) {
      setValue(DATE_RANGE, options[0]);
      return;
    }

    setValue(FROM_DATE, defaultFromDate);
    setValue(TO_DATE, defaultToDate);
  }, []);

  const formatOptionLabel = (data, formatOptionLabelMeta) => {
    if (formatOptionLabelMeta.context === 'menu') {
      const selected = formatOptionLabelMeta.selectValue[0]?.value === data.value;
      return <span className={selected ? styles.selectedMenuOptionInMenu : ''}>{data.label}</span>;
    }

    let formattedOption = data.label;
    let className = '';

    if (data.value === rangeOptions.CUSTOM) {
      if (isValid && customFromDate && customToDate) {
        formattedOption = `${customFromDate} - ${customToDate}`;
      } else {
        formattedOption = 'yyyy-mm-dd - yyyy-mm-dd';
        className = styles.invalid;
      }
    }

    return (
      <div className={styles.window}>
        <Calendar />
        <span className={clsx(styles.windowValue, className)}>{formattedOption}</span>
      </div>
    );
  };

  const clearCustomDateRange = () => {
    setValue(FROM_DATE, '');
    setValue(TO_DATE, '');
  };

  const onClickAway = () => {
    if (!(isValid && customFromDate && customToDate)) {
      setValue(DATE_RANGE, options[0]);
    }
    setIsCustomDatePickerOpen(false);
  };

  const onBack = () => {
    setIsCustomDatePickerOpen(false);
    selectRef.current.focus();
  };

  return (
    <ClickAwayListener onClickAway={onClickAway}>
      <div className={styles.wrapper}>
        <Controller
          control={control}
          name={DATE_RANGE}
          defaultValue={
            defaultDateRangeOptionValue &&
            options.find(({ value }) => value === defaultDateRangeOptionValue)
          }
          render={({ field }) => (
            <ReactSelect
              {...field}
              ref={selectRef}
              options={options}
              placeholder={placeholder}
              openMenuOnFocus={true}
              onMenuOpen={() => setIsCustomDatePickerOpen(false)}
              onChange={(e) => {
                if (e.value === rangeOptions.CUSTOM) {
                  setIsCustomDatePickerOpen(true);
                }
                field.onChange(e);
              }}
              formatOptionLabel={formatOptionLabel}
            />
          )}
        />
        {isCustomDatePickerOpen && (
          <CustomDateRangeSelector
            register={register}
            getValues={getValues}
            control={control}
            onBack={onBack}
            onClear={clearCustomDateRange}
            isValid={!!(isValid && customFromDate && customToDate)}
            {...getMinMaxDates(customFromDate, customToDate)}
          />
        )}
      </div>
    </ClickAwayListener>
  );
}

DateRangeSelector.propTypes = {
  register: PropTypes.func.isRequired,
  getValues: PropTypes.func.isRequired,
  control: PropTypes.object.isRequired,
  watch: PropTypes.func.isRequired,
  setValue: PropTypes.func.isRequired,
  formState: PropTypes.shape({ isValid: PropTypes.bool }).isRequired,
  defaultDateRangeOptionValue: PropTypes.string,
  defaultCustomDateRange: PropTypes.shape({
    [FROM_DATE]: PropTypes.string,
    [TO_DATE]: PropTypes.string,
  }),
  placeholder: PropTypes.string,
};
