import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Field } from '@progress/kendo-react-form';
import { NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';

import * as MyValidators from '../validators.jsx';
import * as MyFormComponents from '../MyFormComponents';
import { MyCommandCell } from './MyCommandCell';



//#region  Cell Functions

/**
 * Calculate HST this current row.
 *
 * @param props Grid properties.
 */
const CalculateHSTAmount = (props) => {
  return (props.dataItem.HSTTaxable == true) ? props.dataItem.Amount * 0.13 : 0;
};


const glCodeCell = (props) => {
  const { dataItem, field } = props;
  const dataValue = dataItem[field] === null ? '' : dataItem[field];
  const handleChange = React.useCallback(
    (e) => {
      props.onChange({
        dataItem: props.dataItem,
        field: props.field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value
      });
    },
    [props.onChange]
  );

  return (
    <td>
      {dataItem.inEdit ? (
        <Field
          mask="000-00-000-00000-0000"
          component={MyFormComponents.FormMaskedTextBox}
          validator={MyValidators.glCodeCell}
          name={`GLAccounts[${props.dataIndex}].${props.field}`}
          onChange={handleChange}
          value={dataValue}
        />
      ) : (
          dataValue
        )}
    </td>
  );
};


/**
 * Amount before HST.
 * @param props Grid properties.
 */
const amountCell = (props) => {
  const { dataItem, field } = props;
  const dataValue = dataItem[field] === null ? '' : dataItem[field];
  console.log('amountCell');
  console.log(dataValue);


  const handleChange = React.useCallback(
    (e) => {
      console.log('handleChange');
      console.log(e);
      props.onChange({
        dataItem: props.dataItem,
        field: props.field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value
      });
    },
    [props.onChange]
  );

  return (
    <td>
      {dataItem.inEdit ? (
        <Field
          format="c2"
          component={MyFormComponents.FormNumericTextBox}
          validator={MyValidators.accountAmountValidator}
          name={`GLAccounts[${props.dataIndex}].${props.field}`}
          value={dataValue}
          editable={true}
          disabled={false}
          onChange={handleChange}
        />
      ) : (
          <Field
            format="c2"
            component={MyFormComponents.FormNumericTextBox}
            validator={MyValidators.accountAmountValidator}
            name={`GLAccounts[${props.dataIndex}].${props.field}`}
            value={dataValue}
            editable={false}
            disabled={true}
            onChange={handleChange}
          />
        )}
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
  const { dataItem, field } = props;
  const dataValue = dataItem[field] === null ? '' : dataItem[field];
  return (
    <td>
      {dataItem.inEdit ? (
        <Field
          component={Checkbox}
          name={`GLAccounts[${props.dataIndex}].${props.field}`}
          value={dataValue}
        />
      ) : (
          dataValue ? "Yes" : "No"
        )}
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
//#endregion


class MyFinanceGlAccounts extends React.Component<any, any> {
  public editField = "inEdit";
  public CommandCell;

  constructor(props) {
    super(props);
    console.log("MyFinanceGlAccounts ctor");
    console.log(props);

    this.state = {
      data: props.value.map(a => ({ ID: a.ID, GLCode: a.Account_x0020_Code, Amount: a.Amount, HSTTaxable: a.HST_x0020_Taxable, HST: a.HST, TotalInvoice: a.Total_x0020_Invoice })),
      // same as data but we use this to reset state.
      receivedData: props.value.map(a => ({ ID: a.ID, GLCode: a.Account_x0020_Code, Amount: a.Amount, HSTTaxable: a.HST_x0020_Taxable, HST: a.HST, TotalInvoice: a.Total_x0020_Invoice }))
    };

    this.CommandCell = MyCommandCell({
      edit: this.enterEdit,
      remove: this.remove,

      add: this.add,
      discard: this.discard,

      update: this.update,
      cancel: this.cancel,

      editField: this.editField
    });
  }

  //#region CRUD Methods
  public enterEdit = (dataItem) => {
    this.setState({
      data: this.state.data.map(item => item.ID === dataItem.ID ? { ...item, inEdit: true } : item)
    });
  }

  public add = (dataItem) => {
    dataItem.inEdit = undefined;
    //dataItem.ID = this.generateId(sampleProducts);

    //sampleProducts.unshift(dataItem);
    this.setState({
      data: [...this.state.data]
    });
  }

  public update = (dataItem) => {
    const data = [...this.state.data];
    const updatedItem = { ...dataItem, inEdit: undefined };

    this.updateItem(data, updatedItem);
    //this.updateItem(sampleProducts, updatedItem);

    this.setState({ data });
  }

  public updateItem = (data, item) => {
    let index = data.findIndex(p => p === item || (item.ID && p.ID === item.ID));
    if (index >= 0) {
      data[index] = { ...item };
    }
  }

  public cancel = (dataItem) => {
    const originalItem = this.state.receivedData.find(p => p.ID === dataItem.ID);
    const data = this.state.data.map(item => item.ID === originalItem.ID ? originalItem : item);

    this.setState({ data });
  }

  public discard = (dataItem) => {
    const data = [...this.state.data];
    this.removeItem(data, dataItem);

    this.setState({ data });
  }

  public remove = (dataItem) => {
    const data = [...this.state.data];
    this.removeItem(data, dataItem);
    //this.removeItem(sampleProducts, dataItem);

    this.setState({ data });
  }

  public itemChange = (event) => {
    console.log("itemChange: " + event.field);
    console.log(event);
    const data = this.state.data.map(item => item.ID === event.dataItem.ID ? { ...item, [event.field]: event.value } : item);
    this.setState({ data });
  }

  public addNew = () => {
    const newDataItem = { inEdit: true, Discontinued: false };

    this.setState({
      data: [newDataItem, ...this.state.data]
    });
  }

  public cancelCurrentChanges = () => {
    //this.setState({ data: [...sampleProducts] });
  }
  //#endregion



  public render() {
    const { data } = this.state;
    const hasEditedItem = data.some(p => p.inEdit);

    return (
      <Grid
        data={data}
        onItemChange={this.itemChange}
        editField={this.editField}
      >
        <GridToolbar>
          <button
            title="Add new"
            className="k-button k-primary"
            onClick={this.addNew}
          >
            Add new
                  </button>
          {hasEditedItem && (
            <button
              title="Cancel current changes"
              className="k-button"
              onClick={this.cancelCurrentChanges}
            >
              Cancel current changes
            </button>
          )}
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
          //cell={hstTaxableCell}
          editor="boolean"
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
        <GridColumn cell={this.CommandCell} width="240px" />
      </Grid>
    );
  }

  public generateId = data => data.reduce((acc, current) => Math.max(acc, current.ID), 0) + 1;

  public removeItem(data, item) {
    let index = data.findIndex(p => p === item || (item.ID && p.ID === item.ID));
    if (index >= 0) {
      data.splice(index, 1);
    }
  }
};

export const MyFinanceGlAccountsComponent = (fieldArrayRenderProps) => {
  const { accounts } = fieldArrayRenderProps;
  console.log("MyFinanceGlAccountsComponent");
  console.log(fieldArrayRenderProps);
  return (
    <div key={fieldArrayRenderProps.value}>
      <MyFinanceGlAccounts {...fieldArrayRenderProps} />
    </div>
  );
}
