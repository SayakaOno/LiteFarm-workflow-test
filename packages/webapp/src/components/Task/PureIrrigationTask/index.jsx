import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Label, Underlined } from '../../Typography';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import ReactSelect from '../../Form/ReactSelect';
import Checkbox from '../../Form/Checkbox';
import RadioGroup from '../../Form/RadioGroup';
import styles from '../../Typography/typography.module.scss';
import Input from '../../Form/Input';
import Unit, { getUnitOptionMap } from '../../Form/Unit';
import { waterUsage } from '../../../util/convert-units/unit';
import PropTypes from 'prop-types';
import WaterUsageCalculatorModal from '../../Modals/WaterUsageCalculatorModal';
import { convert } from '../../../util/convert-units/convert';
import { getIrrigationTaskTypes } from '../../../containers/Task/IrrigationTaskTypes/saga';
import { useDispatch, useSelector } from 'react-redux';
import { irrigationTaskTypesSliceSelector } from '../../../containers/irrigationTaskTypesSlice';
import { getLocationDefaultsByLocationId } from '../../../containers/taskSlice';

const defaultIrrigationTaskTypes = [
  'HAND_WATERING',
  'CHANNEL',
  'DRIP',
  'FLOOD',
  'PIVOT',
  'SPRINKLER',
  'SUB_SURFACE',
  'OTHER',
];
export default function PureIrrigationTask({
  system,
  register,
  control,
  setValue,
  getValues,
  reset,
  watch,
  disabled = false,
  locations,
  otherTaskType = false,
}) {
  const { t } = useTranslation();
  const [showWaterUseCalculatorModal, setShowWaterUseCalculatorModal] = useState(false);
  const { irrigationTaskTypes = [] } = useSelector(irrigationTaskTypesSliceSelector);

  const locationDefaults = useSelector(getLocationDefaultsByLocationId(locations));
  const [irrigationTypeValue, setIrrigationTypeValue] = useState(() => {
    if (locationDefaults?.irrigation_task_type) return locationDefaults?.irrigation_task_type;
  });
  const [totalVolumeWaterUsage, setTotalVolumeWaterUsage] = useState();
  const [totalDepthWaterUsage, setTotalDepthWaterUSage] = useState();
  const dispatch = useDispatch();

  const IrrigationTypeOptions = useMemo(() => {
    let options;
    options = irrigationTaskTypes.map((irrigationType) => {
      return {
        value: irrigationType.irrigation_type_name,
        label: defaultIrrigationTaskTypes.includes(irrigationType.irrigation_type_name)
          ? t(`ADD_TASK.IRRIGATION_VIEW.TYPE.${irrigationType.irrigation_type_name}`)
          : t(irrigationType.irrigation_type_name),
        default_measuring_type: irrigationType.default_measuring_type,
      };
    });
    options.push({
      label: t('ADD_TASK.IRRIGATION_VIEW.TYPE.OTHER'),
      value: 'OTHER',
      default_measuring_type: null,
    });
    return options;
  }, [irrigationTaskTypes]);

  useEffect(() => {
    dispatch(getIrrigationTaskTypes());
  }, []);

  const stateController = () => {
    return { register, getValues, watch, control, setValue, reset };
  };
  const IRRIGATION_TYPE = 'irrigation_task.irrigation_type_name';
  const DEFAULT_IRRIGATION_TASK_LOCATION = 'irrigation_task.default_irrigation_task_type_location';
  const DEFAULT_IRRIGATION_MEASUREMENT = 'irrigation_task.default_irrigation_task_type_measurement';
  const IRRIGATION_TYPE_OTHER = 'irrigation_task.irrigation_task_type_other';
  const MEASUREMENT_TYPE = 'irrigation_task.measuring_type';
  const ESTIMATED_WATER_USAGE = 'irrigation_task.estimated_water_usage';
  const ESTIMATED_WATER_USAGE_UNIT = 'irrigation_task.estimated_water_usage_unit';

  const estimated_water_usage = watch(ESTIMATED_WATER_USAGE);
  const estimated_water_usage_unit = watch(ESTIMATED_WATER_USAGE_UNIT);
  const irrigation_type = watch(IRRIGATION_TYPE);
  const measurement_type = watch(MEASUREMENT_TYPE);

  const onDismissWaterUseCalculatorModel = () => setShowWaterUseCalculatorModal(false);
  const handleModalSubmit = () => {
    setValue(
      ESTIMATED_WATER_USAGE,
      measurement_type === 'VOLUME' ? totalVolumeWaterUsage : totalDepthWaterUsage,
    );
    setValue(
      ESTIMATED_WATER_USAGE_UNIT,
      ['ml', 'l'].includes(estimated_water_usage_unit.value)
        ? getUnitOptionMap()['l']
        : getUnitOptionMap()['gal'],
    );
    onDismissWaterUseCalculatorModel();
  };

  useEffect(() => {
    if (locationDefaults?.default_irrigation_task_type_location) {
      setValue(
        DEFAULT_IRRIGATION_TASK_LOCATION,
        locationDefaults?.default_irrigation_task_type_location,
      );
    } else {
      setValue(DEFAULT_IRRIGATION_TASK_LOCATION, false);
    }

    if (locationDefaults?.default_measuring_type) {
      setValue(MEASUREMENT_TYPE, locationDefaults?.default_measuring_type);
      setValue(
        IRRIGATION_TYPE,
        IrrigationTypeOptions.find(
          (options) => options.value === locationDefaults?.irrigation_task_type,
        ),
      );
    } else {
      setValue(MEASUREMENT_TYPE, '');
    }

    if (locationDefaults?.default_irrigation_task_type_measurement) {
      setValue(
        DEFAULT_IRRIGATION_MEASUREMENT,
        locationDefaults?.default_irrigation_task_type_measurement,
      );
    } else {
      setValue(DEFAULT_IRRIGATION_MEASUREMENT, false);
    }
  }, []);

  const getDefaultIrrigationTypeOptions = () => {
    if (locationDefaults?.irrigation_task_type) {
      return IrrigationTypeOptions.find(
        (options) => options.value === locationDefaults?.irrigation_task_type,
      );
    } else {
      return IrrigationTypeOptions.find((options) => options.value === irrigation_type);
    }
  };
  useEffect(() => {
    if (estimated_water_usage !== totalDepthWaterUsage && otherTaskType) {
      reset({
        ...getValues(),
        irrigation_task: {
          ...getValues().irrigation_task,
          application_depth: '',
          percentage_location_irrigated: '',
        },
      });
      setTotalDepthWaterUSage('');
    }
  }, [showWaterUseCalculatorModal]);

  return (
    <>
      <Controller
        control={control}
        name={IRRIGATION_TYPE}
        rules={{ required: true }}
        render={({ field: { onChange, onBlur, onFocus } }) => {
          return (
            <ReactSelect
              onFocus={onFocus}
              label={t('ADD_TASK.IRRIGATION_VIEW.TYPE_OF_IRRIGATION')}
              options={IrrigationTypeOptions}
              onBlur={onBlur}
              onChange={(e) => {
                onChange(e);
                setIrrigationTypeValue(e.value);
                setValue(MEASUREMENT_TYPE, e.default_measuring_type);
              }}
              isDisabled={disabled}
              value={IrrigationTypeOptions.find((options) => options.value === irrigation_type)}
              defaultValue={getDefaultIrrigationTypeOptions}
            />
          );
        }}
      />
      {(irrigationTypeValue === 'OTHER' ||
        irrigation_type?.label === t('ADD_TASK.IRRIGATION_VIEW.TYPE.OTHER')) && (
        <Input
          style={{ marginTop: '6px' }}
          disabled={disabled}
          label={t('ADD_TASK.IRRIGATION_VIEW.WHAT_TYPE_OF_IRRIGATION')}
          hookFormRegister={register(IRRIGATION_TYPE_OTHER, {
            required: true,
            maxLength: {
              value: 100,
              message: t('ADD_TASK.IRRIGATION_VIEW.IRRIGATION_TYPE_CHAR_LIMIT'),
            },
          })}
        />
      )}
      <Checkbox
        label={t('ADD_TASK.IRRIGATION_VIEW.SET_AS_DEFAULT_TYPE_FOR_THIS_LOCATION')}
        sm
        style={{ marginTop: '6px', marginBottom: '40px' }}
        hookFormRegister={register(DEFAULT_IRRIGATION_TASK_LOCATION)}
        disabled={disabled}
      />
      <Label className={styles.label} style={{ marginBottom: '24px', fontSize: '16px' }}>
        {t('ADD_TASK.IRRIGATION_VIEW.HOW_DO_YOU_MEASURE_WATER_USE_FOR_THIS_IRRIGATION_TYPE')}
      </Label>

      <RadioGroup
        required
        name={MEASUREMENT_TYPE}
        hookFormControl={control}
        disabled={disabled}
        radios={[
          {
            value: 'VOLUME',
            label: t('ADD_TASK.IRRIGATION_VIEW.VOLUME'),
            onChange: () => {
              setValue(MEASUREMENT_TYPE, 'VOLUME');
            },
          },
          {
            value: 'DEPTH',
            label: t('ADD_TASK.IRRIGATION_VIEW.DEPTH'),
            onChange: () => {
              setValue(MEASUREMENT_TYPE, 'DEPTH');
            },
          },
        ]}
      />

      <Checkbox
        label={t('ADD_TASK.IRRIGATION_VIEW.SET_AS_DEFAULT_MEASUREMENT_FOR_THIS_IRRIGATION_TYPE')}
        sm
        hookFormRegister={register(DEFAULT_IRRIGATION_MEASUREMENT)}
        disabled={disabled}
      />

      <Unit
        register={register}
        displayUnitName={ESTIMATED_WATER_USAGE_UNIT}
        label={t('ADD_TASK.IRRIGATION_VIEW.ESTIMATED_WATER_USAGE')}
        hookFormSetValue={setValue}
        hookFormGetValue={getValues}
        hookFromWatch={watch}
        name={ESTIMATED_WATER_USAGE}
        unitType={waterUsage}
        max={999999999}
        system={system}
        control={control}
        style={{ marginTop: '40px' }}
        disabled={disabled}
        onChangeUnitOption={(e) => {
          setValue(
            ESTIMATED_WATER_USAGE,
            convert(estimated_water_usage).from(estimated_water_usage_unit.value).to(e.value),
          );
        }}
      />

      <Label style={{ marginTop: '4px', marginBottom: `${disabled ? 36 : 0}px` }}>
        {t('ADD_TASK.IRRIGATION_VIEW.NOT_SURE')}{' '}
        <Underlined onClick={() => !disabled && setShowWaterUseCalculatorModal(true)}>
          {t('ADD_TASK.IRRIGATION_VIEW.CALCULATE_WATER_USAGE')}
        </Underlined>
      </Label>

      {showWaterUseCalculatorModal && measurement_type && (
        <WaterUsageCalculatorModal
          dismissModal={onDismissWaterUseCalculatorModel}
          measurementType={measurement_type}
          system={system}
          handleModalSubmit={handleModalSubmit}
          totalVolumeWaterUsage={totalVolumeWaterUsage}
          setTotalVolumeWaterUsage={setTotalVolumeWaterUsage}
          totalDepthWaterUsage={totalDepthWaterUsage}
          setTotalDepthWaterUSage={setTotalDepthWaterUSage}
          formState={stateController}
          locationDefaults={locationDefaults}
        />
      )}
    </>
  );
}

PureIrrigationTask.propTypes = {
  system: PropTypes.oneOf(['imperial', 'metric']).isRequired,
  disabled: PropTypes.bool,
  locations: PropTypes.array,
};
