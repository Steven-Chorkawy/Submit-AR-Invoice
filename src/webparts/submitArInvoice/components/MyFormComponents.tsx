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
