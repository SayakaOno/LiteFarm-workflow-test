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

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ReactComponent as ReportIcon } from '../../../assets/images/finance/Report-icn.svg';
import FinanceDateRangeSelector from '../../../components/Finances/DateRangeSelector';
import Button from '../../../components/Form/Button';
import TextButton from '../../../components/Form/Button/TextButton';
import ModalComponent from '../../../components/Modals/ModalComponent/v2';
import { Semibold, Text } from '../../../components/Typography';
import TransactionFilterContent from '../../Filter/Transactions';
import { EXPENSE_TYPE, REVENUE_TYPE } from '../../Filter/constants';
import { transactionsFilterSelector } from '../../filterSlice';
import { downloadFinanceReport } from '../saga';
import { dateRangeDataSelector } from '../selectors';
import useTransactions from '../useTransactions';
import styles from './styles.module.scss';

const Report = () => {
  const { t } = useTranslation();

  const dashboardDateFilter = useSelector(dateRangeDataSelector);
  const dashboardTypesFilter = useSelector(transactionsFilterSelector);

  const [isExportReportOpen, setIsExportReportOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(dashboardDateFilter);
  const [typesFilter, setTypesFilter] = useState(dashboardTypesFilter);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const dispatch = useDispatch();
  const filterRef = useRef({});
  const transactions = useTransactions({
    dateFilter,
    expenseTypeFilter: typesFilter?.[EXPENSE_TYPE],
    revenueTypeFilter: typesFilter?.[REVENUE_TYPE],
  });

  // If dashboard filters change, update report filters
  useEffect(() => {
    setDateFilter(dashboardDateFilter);
  }, [dashboardDateFilter]);

  useEffect(() => {
    setTypesFilter(dashboardTypesFilter);
  }, [dashboardTypesFilter]);

  const onValidityChange = (isValid) => {
    setIsButtonDisabled(!isValid);
  };

  const dismissModal = () => {
    setIsExportReportOpen(false);
    setDateFilter(dashboardDateFilter);
    setTypesFilter(dashboardTypesFilter);
  };

  // Not needed for current report but will be needed for income statement

  /*   const sumTransactionAmount = (transactionType) => {
    const filteredTransactions = transactions.filter(
      (transaction) => transaction.transactionType === transactionType,
    );
    const summary = {};
    filteredTransactions.forEach((transaction) => {
      summary[transaction.typeLabel] =
        summary[transaction.typeLabel] ?? 0 + Math.abs(transaction.amount);
    });
    return summary;
  };

  const expenseSummary = useMemo(
    () => sumTransactionAmount(transactionTypeEnum.expense),
    [transactions],
  );

  const revenueSummary = useMemo(
    () => sumTransactionAmount(transactionTypeEnum.revenue),
    [transactions],
  );

  const cropRevenueSummary = useMemo(() => {
    const filteredTransactions = transactions.filter(
      (transaction) => transaction.transactionType === transactionTypeEnum.cropRevenue,
    );
    const summary = {};
    filteredTransactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        summary[item.title] = {
          amount: summary[item.title]?.amount ?? 0 + Math.abs(item.amount),
          quantity: summary[item.title]?.quantity ?? 0 + Math.abs(item.quantity),
          quantityUnit: item.quantityUnit,
        };
      });
    });
    return summary;
  }, [transactions]);

  const labourSummary = useMemo(() => {
    const filteredTransactions = transactions.filter(
      (transaction) => transaction.transactionType === transactionTypeEnum.labourExpense,
    );
    const summary = {};
    filteredTransactions.forEach((transaction) => {
      const employeeItems = transaction.items[LABOUR_ITEMS_GROUPING_OPTIONS.EMPLOYEE];
      employeeItems.forEach((employeeItem) => {
        summary[employeeItem.employee] = {
          duration: summary[employeeItem.employee]?.duration ?? 0 + employeeItem.time,
          amount: summary[employeeItem.employee]?.amount ?? 0 + employeeItem.labourCost,
        };
      });
    });
    return summary;
  }, [transactions]); */

  const handleExport = () => {
    dispatch(
      downloadFinanceReport({
        transactions,
        config: {
          dateFilter,
          typesFilter,
        },
      }),
    );
    dismissModal();
  };

  return (
    <>
      <TextButton onClick={() => setIsExportReportOpen(true)} className={styles.reportButton}>
        <ReportIcon />
        {t('SALE.FINANCES.REPORT')}
      </TextButton>
      {isExportReportOpen && (
        <ModalComponent
          title={t('SALE.FINANCES.EXPORT_REPORT')}
          titleClassName={styles.title}
          dismissModal={dismissModal}
          buttonGroup={
            <Button fullLength onClick={handleExport} color={'primary'} disabled={isButtonDisabled}>
              {t('common:EXPORT')}
            </Button>
          }
        >
          <div className={styles.exportContents}>
            <Semibold className={styles.helpText}>{t('SALE.FINANCES.REPORT_HELP_TEXT')}</Semibold>
            <div className={styles.dateFilterContainer}>
              <Text>Date</Text>
              <FinanceDateRangeSelector
                value={dateFilter}
                onChange={(dateRange) => {
                  setDateFilter({ ...dateFilter, ...dateRange });
                }}
                onValidityChange={onValidityChange}
              />
            </div>
            <TransactionFilterContent
              transactionsFilter={dashboardTypesFilter}
              filterRef={filterRef}
              filterContainerClassName={styles.filterContainer}
              onChange={(filterKey, filterState) =>
                setTypesFilter({ ...typesFilter, [filterKey]: filterState })
              }
            />
          </div>
        </ModalComponent>
      )}
    </>
  );
};

export default Report;
