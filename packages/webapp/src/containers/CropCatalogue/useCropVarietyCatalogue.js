import {
  getCurrentManagementPlans,
  getExpiredManagementPlans,
  getPlannedManagementPlans,
  allVarietyCropManagementPlanSelector,
  cropVarietiesWithoutManagementPlanByCropIdSelector,
  currentCropVarietiesByCropIdSelector,
  expiredCropVarietiesByCropIdSelector,
  plannedCropVarietiesByCropIdSelector,
} from '../managementPlanSlice';

import { useSelector } from 'react-redux';
import { cropCatalogueFilterDateSelector, cropCatalogueFilterSelector } from '../filterSlice';
import { useMemo } from 'react';
import useStringFilteredCrops from './useStringFilteredCrops';
import { ACTIVE, COMPLETE, LOCATION, PLANNED, STATUS, SUPPLIERS } from '../Filter/constants';
import { useTranslation } from 'react-i18next';
import useFilterNoPlan from './useFilterNoPlan';
import useSortByCropTranslation from './useSortByCropTranslation';
import { managementPlansWithCurrentLocationSelector } from '../Task/TaskCrops/managementPlansWithLocationSelector';

export default function useCropCatalogue(filterString, crop_id) {
  let allVarietyCropManagementPlan = useSelector(allVarietyCropManagementPlanSelector(crop_id));
  const cropVarietiesWithoutManagementPlanByCropId = useSelector(
    cropVarietiesWithoutManagementPlanByCropIdSelector(crop_id),
  );
  const currentCropVarietiesByCropId = useSelector(currentCropVarietiesByCropIdSelector(crop_id));
  const expiredCropVarietiesByCropId = useSelector(expiredCropVarietiesByCropIdSelector(crop_id));
  const plannedCropVarietiesByCropId = useSelector(plannedCropVarietiesByCropIdSelector(crop_id));

  const cropCataloguesStatus = {
    sum:
      plannedCropVarietiesByCropId.length +
      expiredCropVarietiesByCropId.length +
      currentCropVarietiesByCropId.length +
      cropVarietiesWithoutManagementPlanByCropId.length,
    active: currentCropVarietiesByCropId.length,
    planned: plannedCropVarietiesByCropId.length,
    past: expiredCropVarietiesByCropId.length,
    needsPlan: cropVarietiesWithoutManagementPlanByCropId.length,
  };

  let allVarietyCrop = [];
  for (let main_plan of allVarietyCropManagementPlan) {
    let varietyCrop = { ...main_plan };

    varietyCrop.noplan = cropVarietiesWithoutManagementPlanByCropId.filter(
      (c) => c.crop_variety_id === main_plan.crop_variety_id,
    ).length;
    varietyCrop.active = currentCropVarietiesByCropId.filter(
      (c) => c.crop_variety_id === main_plan.crop_variety_id,
    ).length;
    varietyCrop.past = expiredCropVarietiesByCropId.filter(
      (c) => c.crop_variety_id === main_plan.crop_variety_id,
    ).length;
    varietyCrop.planned = plannedCropVarietiesByCropId.filter(
      (c) => c.crop_variety_id === main_plan.crop_variety_id,
    ).length;
    allVarietyCrop.push(varietyCrop);
    // console.log('main_plan', main_plan)
  }

  // Today's date
  const cropCatalogFilterDate = useSelector(cropCatalogueFilterDateSelector);
  // console.log('cropCatalogFilterDate', cropCatalogFilterDate)

  // location, status, supplier
  const cropCatalogueFilter = useSelector(cropCatalogueFilterSelector);
  // console.log('cropCatalogueFilter', cropCatalogueFilter)

  const managementPlansFilteredByFilterString = useStringFilteredCrops(
    allVarietyCrop,
    filterString,
  );

  const managementPlansFilteredByLocations = useMemo(() => {
    const locationFilter = cropCatalogueFilter[LOCATION];
    const included = new Set();
    for (const location_id in locationFilter) {
      if (locationFilter[location_id].active) included.add(location_id);
    }
    if (included.size === 0) return managementPlansFilteredByFilterString;
    return managementPlansFilteredByFilterString.filter((managementPlan) =>
      included.has(managementPlan.location?.location_id),
    );
  }, [cropCatalogueFilter[LOCATION], managementPlansFilteredByFilterString]);

  const managementPlansFilteredBySuppliers = useMemo(() => {
    const supplierFilter = cropCatalogueFilter[SUPPLIERS];
    const included = new Set();
    for (const supplier in supplierFilter) {
      if (supplierFilter[supplier].active) included.add(supplier);
    }
    if (included.size === 0) return managementPlansFilteredByLocations;
    return managementPlansFilteredByLocations.filter((managementPlan) =>
      included.has(managementPlan.supplier),
    );
  }, [cropCatalogueFilter[SUPPLIERS], managementPlansFilteredByLocations]);

  const cropCatalogue = useMemo(() => {
    // const time = new Date(cropCatalogFilterDate).getTime();
    // const managementPlansByStatus = {
    //   active: getCurrentManagementPlans(managementPlansFilteredBySuppliers, time),
    //   planned: getPlannedManagementPlans(managementPlansFilteredBySuppliers, time),
    //   past: getExpiredManagementPlans(managementPlansFilteredBySuppliers, time),
    // };
    // const managementPlansByCropId = {};
    // for (const status in managementPlansByStatus) {
    //   for (const managementPlan of managementPlansByStatus[status]) {
    //     if (!managementPlansByCropId.hasOwnProperty(managementPlan.crop_id)) {
    //       managementPlansByCropId[managementPlan.crop_id] = {
    //         active: [],
    //         planned: [],
    //         past: [],
    //         crop_common_name: managementPlan.crop_common_name,
    //         crop_translation_key: managementPlan.crop_translation_key,
    //         imageKey: managementPlan.crop_translation_key?.toLowerCase(),
    //         crop_id: managementPlan.crop_id,
    //         crop_photo_url: managementPlan.crop_photo_url,
    //       };
    //     }
    //     managementPlansByCropId[managementPlan.crop_id][status].push(managementPlan);
    //   }
    // }
    return allVarietyCrop;
    // return Object.values(managementPlansByCropId);
  }, [managementPlansFilteredBySuppliers, cropCatalogFilterDate]);

  const cropCatalogueFilteredByStatus = useMemo(() => {
    const statusFilter = cropCatalogueFilter[STATUS];
    const included = new Set();
    for (const status in statusFilter) {
      if (statusFilter[status].active) included.add(status);
    }
    if (included.size === 0) return cropCatalogue;
    const newCropCatalogue = cropCatalogue.map((catalogue) => ({
      ...catalogue,
      active: statusFilter[ACTIVE].active ? catalogue.active : [],
      planned: statusFilter[PLANNED].active ? catalogue.planned : [],
      past: statusFilter[COMPLETE].active ? catalogue.past : [],
    }));
    return newCropCatalogue.filter(
      (catalog) => catalog.active.length || catalog.past.length || catalog.planned.length,
    );
  }, [cropCatalogueFilter[STATUS], cropCatalogue]);

  // const cropCataloguesStatus = useMemo(() => {
  //   const cropCataloguesStatus = { active: 0, planned: 0, past: 0 };
  //   for (const managementPlansByStatus of cropCatalogueFilteredByStatus) {
  //     for (const status in cropCataloguesStatus) {
  //       cropCataloguesStatus[status] += managementPlansByStatus[status].length;
  //     }
  //   }
  //   return {
  //     ...cropCataloguesStatus,
  //     sum: cropCataloguesStatus.active + cropCataloguesStatus.planned + cropCataloguesStatus.past,
  //   };
  // }, [cropCatalogueFilteredByStatus]);

  const { t } = useTranslation();
  const onlyOneOfTwoNumberIsZero = (i, j) => i + j > 0 && i * j === 0;
  const sortedCropCatalogue = useMemo(() => {
    return cropCatalogueFilteredByStatus.sort((catalog_i, catalog_j) => {
      if (onlyOneOfTwoNumberIsZero(catalog_i.active.length, catalog_j.active.length)) {
        return catalog_j.active.length - catalog_i.active.length;
      } else if (
        onlyOneOfTwoNumberIsZero(catalog_i.planned.length, catalog_j.planned.length) &&
        catalog_j.active.length === 0 &&
        catalog_i.active.length === 0
      ) {
        return catalog_j.planned.length - catalog_i.planned.length;
      } else {
        return t(`crop:${catalog_i.crop_translation_key}`) >
          t(`crop:${catalog_j.crop_translation_key}`)
          ? 1
          : -1;
      }
    });
  }, [cropCatalogueFilteredByStatus]);

  const filteredCropVarietiesWithoutManagementPlan = useSortByCropTranslation(
    useFilterNoPlan(filterString),
  );

  const filteredCropsWithoutManagementPlan = useMemo(() => {
    const cropIdsWithPlan = new Set(sortedCropCatalogue.map(({ crop_id }) => crop_id));
    return filteredCropVarietiesWithoutManagementPlan.filter(
      (cropVariety) => !cropIdsWithPlan.has(cropVariety.crop_id),
    );
  }, [filteredCropVarietiesWithoutManagementPlan, sortedCropCatalogue]);

  const sortedCropCatalogueWithNeedsPlanProp = useMemo(() => {
    const cropIdsWithoutPlan = new Set(
      filteredCropVarietiesWithoutManagementPlan.map(({ crop_id }) => crop_id),
    );
    return sortedCropCatalogue.map((crop) => ({
      ...crop,
      needsPlan: cropIdsWithoutPlan.has(crop.crop_id),
    }));
  }, [filteredCropVarietiesWithoutManagementPlan, sortedCropCatalogue]);

  // console.log('sortedCropCatalogueWithNeedsPlanProp', sortedCropCatalogueWithNeedsPlanProp)

  return {
    cropCatalogue: sortedCropCatalogueWithNeedsPlanProp,
    filteredCropsWithoutManagementPlan,
    ...cropCataloguesStatus,
  };
}