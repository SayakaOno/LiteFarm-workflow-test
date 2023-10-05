import React, { useEffect, useMemo } from 'react';
import Layout from '../../../components/Layout';
import PageTitle from '../../../components/PageTitle/v2';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { salesSelector } from '../selectors';
import { allRevenueTypesSelector } from '../../revenueTypeSlice';
import WholeFarmRevenue from '../../../components/Finances/WholeFarmRevenue';
import { AddLink, Semibold } from '../../../components/Typography';
import ActualRevenueItem from '../ActualRevenueItem';
import FinanceListHeader from '../../../components/Finances/FinanceListHeader';
import { calcActualRevenue, filterSalesByDateRange } from '../util';
import { setPersistedPaths } from '../../hooks/useHookFormPersist/hookFormPersistSlice';
import { getRevenueTypes } from '../saga';
import DateRangeSelector from '../../../components/Finances/DateRangeSelector';
import useDateRangeSelector from '../../../components/DateRangeSelector/useDateRangeSelector';
import { SUNDAY } from '../../../util/dateRange';

export default function ActualRevenue({ history, match }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onGoBack = () => history.back();
  const onAddRevenue = () => {
    dispatch(setPersistedPaths(['/revenue_types', '/add_sale']));
    history.push('/revenue_types');
  };
  // TODO: refactor sale data after finance reducer is remade
  const sales = useSelector(salesSelector);
  const allRevenueTypes = useSelector(allRevenueTypesSelector);
  const { startDate: fromDate, endDate: toDate } = useDateRangeSelector({ weekStartDate: SUNDAY });

  const revenueForWholeFarm = useMemo(
    () => calcActualRevenue(sales, fromDate, toDate, allRevenueTypes),
    [sales, fromDate, toDate, allRevenueTypes],
  );
  const filteredSales = useMemo(
    () => filterSalesByDateRange(sales, fromDate, toDate),
    [sales, fromDate, toDate],
  );

  useEffect(() => {
    if (!allRevenueTypes?.length) {
      dispatch(getRevenueTypes());
    }
  }, []);

  return (
    <Layout>
      <PageTitle
        title={t('FINANCES.ACTUAL_REVENUE.TITLE')}
        style={{ marginBottom: '24px' }}
        onGoBack={onGoBack}
      />

      <WholeFarmRevenue amount={revenueForWholeFarm} style={{ marginBottom: '14px' }} />
      <AddLink onClick={onAddRevenue} style={{ marginBottom: '32px' }}>
        {t('FINANCES.ACTUAL_REVENUE.ADD_REVENUE')}
      </AddLink>

      <Semibold style={{ marginBottom: '24px' }} sm>
        {t('FINANCES.VIEW_WITHIN_DATE_RANGE')}
      </Semibold>
      <DateRangeSelector />

      <FinanceListHeader
        firstColumn={t('FINANCES.DATE')}
        secondColumn={t('FINANCES.REVENUE')}
        style={{ marginBottom: '8px' }}
      />
      {filteredSales.map((sale) => (
        <ActualRevenueItem
          key={sale.sale_id}
          sale={sale}
          history={history}
          style={{ marginBottom: '16px' }}
        />
      ))}
    </Layout>
  );
}
