import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Field } from '@progress/kendo-react-form';
import { NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';

import * as MyValidators from './validators.jsx';
import * as MyFormComponents from './MyFormComponents';

/**
   * Calculate HST this current row.
   *
   * @param props Grid properties.
   */
const CalculateHSTAmount = (props) => {
  return (props.dataItem.HSTTaxable == true) ? props.dataItem.Amount * 0.13 : 0;
};


const glCodeCell = (props) => {
  return (
    <td>
      <Field
        mask="000-00-000-00000-0000"
        component={MyFormComponents.FormMaskedTextBox}
        validator={MyValidators.glCodeValidator}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
      />
    </td>
  );
};


/**
 * Amount before HST.
 * @param props Grid properties.
 */
const amountCell = (props) => {
  return (
    <td>
      <Field
        format="c2"
        component={MyFormComponents.FormNumericTextBox}
        validator={MyValidators.accountAmountValidator}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
      />
    </td>
  );
};


/**
 * Total Amount including HST.
 * Amount + HST Amount
 * @param props Grid properties.
 */
const totalInvoiceCell = (props) => {
  return (
    <td>
      <Field
        format="c2"
        component={NumericTextBox}
        name='TotalInvoice'
        readonly={true}
        disabled={true}
        value={
          (props.dataItem.Amount == null) ? 0 : CalculateHSTAmount(props) + props.dataItem.Amount
        }
      />
    </td>
  );
};


/**
 * Boolean, Does HST Apply?
 * @param props Grid Properties
 */
const hstTaxableCell = (props) => {
  return (
    <td>
      <Field
        component={Checkbox}
        name={`GLAccounts[${props.dataIndex}].${props.field}`}
      />
    </td>
  );
};


/**
 * HST Calculated from Amount.
 * HST = Amount * 0.13
 * EX: $1,000 * 0.13 = $130
 * @param props Grid Properties
 */
const hstCell = (props) => {
  return (
    <td>
      <Field
        format="c2"
        component={NumericTextBox}
        name="HST"
        readonly={true}
        disabled={true}
        value={CalculateHSTAmount(props)}
      />
    </td>
  );
};


const commandCell = (onRemove) => (props) => {
  const onClick = React.useCallback(
    (e) => {
      e.preventDefault();
      onRemove(props);
    },
    [onRemove]
  );
  return (
    <td>
      <Button
        className="k-button k-grid-remove-command"
        icon="delete"
        onClick={onClick}
      ></Button>
    </td>
  );
};


export const MyGLAccountComponent = (fieldArrayRenderProps) => {
  const { validationMessage, visited, label } = fieldArrayRenderProps;

  if (fieldArrayRenderProps.value.length === 0) {
    fieldArrayRenderProps.onUnshift({
      value: {
        GLCode: '',
        Amount: '',
        HSTTaxable: false
      }
    });
  }

  const onAdd = React.useCallback(
    (e) => {
      e.preventDefault();
      fieldArrayRenderProps.onUnshift({
        value: {
          GLCode: '',
          Amount: '',
          HSTTaxable: false
        }
      });
    },
    [fieldArrayRenderProps.onUnshift]
  );

  const onRemove = React.useCallback(
    (cellProps) => fieldArrayRenderProps.onRemove({ index: cellProps.dataIndex }),
    [fieldArrayRenderProps.onRemove]
  );

  return (
    <div key={fieldArrayRenderProps.value}>
      <Label id={`${label}_id`}>
        {label}
      </Label>
      <Grid
        data={fieldArrayRenderProps.value}
        resizable={true}
      >
        <GridToolbar>
          <Button title="Add new"
            className="k-button k-primary"
            icon="plus"
            onClick={onAdd} >Add new Account</Button>
        </GridToolbar>

        <GridColumn
          field="GLCode"
          title="* G/L Account #"
          cell={glCodeCell}
          width="200px"
        />

        <GridColumn
          field="Amount"
          title="* Amount"
          cell={amountCell}
        />

        <GridColumn
          field="HSTTaxable"
          title="HST"
          cell={hstTaxableCell}
          width="60px"
        />

        <GridColumn
          field="HST"
          title="HST Amount"
          cell={hstCell}
        />

        <GridColumn
          field="TotalInvoice"
          title="Total Invoice"
          cell={totalInvoiceCell}
        />

        {
          fieldArrayRenderProps.value.length > 1
          && <GridColumn editable={false} cell={commandCell(onRemove)} width="90px" />
        }
      </Grid>
    </div>
  );
};
