
import * as React from 'react';
import * as ReactDom from 'react-dom';

import { FieldWrapper } from '@progress/kendo-react-form';
import {
  Input, MaskedTextBox, NumericTextBox,
  Checkbox, ColorPicker, Switch, RadioGroup,
  Slider, SliderLabel
} from '@progress/kendo-react-inputs';
import {
  DatePicker, TimePicker, DateTimePicker,
  DateRangePicker, DateInput
} from '@progress/kendo-react-dateinputs';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';
import { Upload } from '@progress/kendo-react-upload';
import { DropDownList, AutoComplete, MultiSelect, ComboBox } from '@progress/kendo-react-dropdowns';

import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";


import { MyCustomerCardComponent } from './MyCustomerCardComponent';

export const FormInput = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, type, optional, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid} editorDisabled={disabled} optional={optional}>{label}</Label>
      <div className={'k-form-field-wrap'}>
        <Input
          valid={valid}
          type={type}
          id={id}
          disabled={disabled}
          ariaDescribedBy={`${hindId} ${errorId}`}
          {...others}
        />
        {
          showHint &&
          <Hint id={hindId}>{hint}</Hint>
        }
        {
          showValidationMessage &&
          <Error id={errorId}>{validationMessage}</Error>
        }
      </div>
    </FieldWrapper>
  );
};


export const FormRadioGroup = (fieldRenderProps) => {
  const { validationMessage, touched, id, label, valid, disabled, hint, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper>
      <Label id={labelId} editorId={id} editorValid={valid} editorDisabled={disabled}>{label}</Label>
      <RadioGroup
        id={id}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ariaLabelledBy={labelId}
        valid={valid}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormNumericTextBox = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid} editorDisabled={disabled}>{label}</Label>
      <NumericTextBox
        ariaDescribedBy={`${hindId} ${errorId}`}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormCheckbox = (fieldRenderProps) => {
  const { validationMessage, touched, id, valid, disabled, hint, optional, label, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const fullLabel = <span>{label}{optional ? <span className={'k-label-optional'}>(Optional)</span> : ''}</span>;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';

  return (
    <FieldWrapper>
      <Checkbox
        ariaDescribedBy={`${hindId} ${errorId}`}
        label={fullLabel}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormSwitch = (fieldRenderProps) => {
  const { validationMessage, touched, label, optional, id, valid, disabled, hint, ...others } = fieldRenderProps;
  const editorRef = React.useRef(null);

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper>
      <Label
        id={labelId}
        editorRef={editorRef}
        editorId={id}
        editorValid={valid}
        editorDisabled={disabled}
        optional={optional}
      >
        {label}
      </Label>
      <Switch
        ref={editorRef}
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormMaskedTextBox = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, hint, optional, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid} optional={optional}>{label}</Label>
      <div className={'k-form-field-wrap'}>
        <MaskedTextBox
          ariaDescribedBy={`${hindId} ${errorId}`}
          valid={valid}
          id={id}
          {...others}
        />
        {
          showHint &&
          <Hint id={hindId}>{hint}</Hint>
        }
        {
          showValidationMessage &&
          <Error id={errorId}>{validationMessage}</Error>
        }
      </div>
    </FieldWrapper>
  );
};

export const FormTextArea = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, hint, optional, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid} optional={optional}>{label}</Label>
      <textarea
        aria-describedby={`${hindId} ${errorId}`}
        className={'k-textarea k-autofill'}
        id={id}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormColorPicker = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;
  const editorRef = React.useRef(null);

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label
        id={labelId}
        editorRef={editorRef}
        editorId={id}
        editorValid={valid}
        editorDisabled={disabled}
      >
        {label}
      </Label>
      <ColorPicker
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ref={editorRef}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormSlider = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, data, ...others } = fieldRenderProps;

  const editorRef = React.useRef(null);
  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper>
      <Label
        id={labelId}
        editorRef={editorRef}
        editorId={id}
        editorValid={valid}
        editorDisabled={disabled}
      >
        {label}
      </Label>
      <Slider
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ref={editorRef}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      >
        {
          data.map(value => (
            <SliderLabel
              title={value}
              key={value}
              position={value}
            />
          ))
        }
      </Slider>
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormUpload = (fieldRenderProps) => {
  const { valid, value, id, optional, label, hint, validationMessage, touched, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  const onChangeHandler = (event) => {
    fieldRenderProps.onChange({ value: event.newState });
    if (fieldRenderProps.myOnChange) {
      fieldRenderProps.myOnChange.call(undefined, {
        target: {
          value: event.newState,
          props: event.target.props
        }
      });
    }
  };
  const onRemoveHandler = (event) => {
    fieldRenderProps.onChange({ value: event.newState });
  };

  return (
    <FieldWrapper>
      <Label id={labelId} editorId={id} editorValid={valid} optional={optional}>
        {label}
      </Label>
      <Upload
        id={id}
        valid={valid}
        autoUpload={false}
        showActionButtons={false}
        multiple={false}
        files={value}
        onAdd={onChangeHandler}
        onRemove={onRemoveHandler}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ariaLabelledBy={labelId}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormDropDownList = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;
  const editorRef = React.useRef(null);

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label
        id={labelId}
        editorRef={editorRef}
        editorId={id}
        editorValid={valid}
        editorDisabled={disabled}
      >
        {label}
      </Label>
      <DropDownList
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ref={editorRef}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormAutoComplete = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;
  const editorRef = React.useRef(null);

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label
        id={labelId}
        editorRef={editorRef}
        editorId={id}
        editorValid={valid}
        editorDisabled={disabled}
      >
        {label}
      </Label>
      <AutoComplete
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ref={editorRef}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};


export const CustomerComboBox = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;
  const editorRef = React.useRef(null);

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';
  const selectedCustomer = fieldRenderProps.value;

  return (
    <div>
      <FieldWrapper style={wrapperStyle}>
        <Label id={labelId} editorRef={editorRef} editorId={id} editorValid={valid} editorDisabled={disabled}>
          {label}
        </Label>
        <ComboBox
          ariaLabelledBy={labelId}
          ariaDescribedBy={`${hindId} ${errorId}`}
          ref={editorRef}
          valid={valid}
          id={id}
          disabled={disabled}
          onChange={fieldRenderProps.onChange}
          {...others}
        />
        {
          showHint &&
          <Hint id={hindId}>{hint}</Hint>
        }
        {
          showValidationMessage &&
          <Error id={errorId}>{validationMessage}</Error>
        }
      </FieldWrapper>
      <MyCustomerCardComponent
        selectedCustomer={selectedCustomer}
        onCustomCustomerChange={fieldRenderProps.onCustomCustomerChange}
      />

    </div>
  );
};

export const FormComboBox = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;
  const editorRef = React.useRef(null);

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label id={labelId} editorRef={editorRef} editorId={id} editorValid={valid} editorDisabled={disabled}>
        {label}
      </Label>
      <ComboBox
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ref={editorRef}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormMultiSelect = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;
  const editorRef = React.useRef(null);

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label id={labelId} editorRef={editorRef} editorId={id} editorValid={valid} editorDisabled={disabled}>
        {label}
      </Label>
      <MultiSelect
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ref={editorRef}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormDatePicker = (fieldRenderProps) => {
  const {
    validationMessage, touched, label, id, valid,
    disabled, hint, wrapperStyle, hintDirection, ...others
  } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label id={labelId} editorId={id} editorValid={valid} editorDisabled={disabled}>
        {label}
      </Label>
      <div className={'k-form-field-wrap'}>
        <DatePicker
          ariaLabelledBy={labelId}
          ariaDescribedBy={`${hindId} ${errorId}`}
          valid={valid}
          id={id}
          disabled={disabled}
          {...others}
        />
        {
          showHint &&
          <Hint id={hindId} direction={hintDirection}>{hint}</Hint>
        }
        {
          showValidationMessage &&
          <Error id={errorId}>{validationMessage}</Error>
        }
      </div>
    </FieldWrapper>
  );
};

export const FormDateTimePicker = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label id={labelId} editorId={id} editorValid={valid} editorDisabled={disabled}>
        {label}
      </Label>
      <DateTimePicker
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormTimePicker = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label id={labelId} editorId={id} editorValid={valid} editorDisabled={disabled}>
        {label}
      </Label>
      <TimePicker
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormDateInput = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label id={labelId} editorId={id} editorValid={valid} editorDisabled={disabled}>
        {label}
      </Label>
      <DateInput
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormDateRangePicker = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, wrapperStyle, ...others } = fieldRenderProps;
  const editorRef = React.useRef(null);

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';
  const labelId = label ? `${id}_label` : '';

  return (
    <FieldWrapper style={wrapperStyle}>
      <Label id={labelId} editorRef={editorRef} editorId={id} editorValid={valid} editorDisabled={disabled}>
        {label}
      </Label>
      <DateRangePicker
        ariaLabelledBy={labelId}
        ariaDescribedBy={`${hindId} ${errorId}`}
        ref={editorRef}
        valid={valid}
        id={id}
        disabled={disabled}
        {...others}
      />
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormFloatingNumericTextBox = (fieldRenderProps) => {
  const { validationMessage, touched, label, id, valid, disabled, hint, optional, value, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';

  return (
    <FieldWrapper>
      <FloatingLabel
        optional={optional}
        editorValue={value}
        editorId={id}
        editorValid={valid}
        editorDisabled={disabled}
        label={label}
      >
        <NumericTextBox
          ariaDescribedBy={`${hindId} ${errorId}`}
          value={value}
          valid={valid}
          id={id}
          disabled={disabled}
          {...others}
        />
      </FloatingLabel>
      {
        showHint &&
        <Hint id={hindId}>{hint}</Hint>
      }
      {
        showValidationMessage &&
        <Error id={errorId}>{validationMessage}</Error>
      }
    </FieldWrapper>
  );
};

export const FormPeoplePicker = (fieldRenderProps) => {
  console.log('FormPeoplePicker');
  console.log(fieldRenderProps);
  const { validationMessage, touched, label, id, valid, disabled, hint, optional, value, ...others } = fieldRenderProps;

  const showValidationMessage = touched && validationMessage;
  const showHint = !showValidationMessage && hint;
  const hindId = showHint ? `${id}_hint` : '';
  const errorId = showValidationMessage ? `${id}_error` : '';

  return (
    <FieldWrapper>
      <PeoplePicker
        context={fieldRenderProps.context}
        titleText={label}
        personSelectionLimit={1}
        //groupName={"Team Site Owners"} // Leave this blank in case you want to filter from all users
        showtooltip={true}
        isRequired={true}
        selectedItems={fieldRenderProps.selectedItems}
        showHiddenInUI={false}
        principalTypes={[PrincipalType.User]}
        resolveDelay={1000}
        //defaultSelectedUsers={['schorkawy@clarington.net']}
      />
    </FieldWrapper>
  );
}
