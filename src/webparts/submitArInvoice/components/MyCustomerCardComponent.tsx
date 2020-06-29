import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { IMyCustomerProps } from '../components/IMyCustomerProps';
import { IMyCustomerState } from '../components/IMyCustomerState';

export class MyCustomerCardComponent extends React.Component<IMyCustomerProps, IMyCustomerState> {

  /**
   *
   */
  constructor(props) {
    super(props);

    this.state = {
      selectedCustomer: props.selectedCustomer
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ ...nextProps });
  }

  render() {

    if (this.state.selectedCustomer == undefined) {
      return (<div key="0">Select a Customer</div>);
    }
    else {
      return (
        <Card key={this.state.selectedCustomer.ID} type="info">
          <CardBody>
            <CardTitle>{this.state.selectedCustomer.Title}</CardTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p>GP Customer ID: {this.state.selectedCustomer.GPCustomerID}</p>
              <p>Customer Name: {this.state.selectedCustomer.Company}</p>
              <p>Email Address: {this.state.selectedCustomer.Email}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p>Telephone Number: {this.state.selectedCustomer.WorkPhone}</p>
              <p>Mailing Address: {this.state.selectedCustomer.WorkAddress}</p>
            </div>

            <p>Notes: {this.state.selectedCustomer.Comments}</p>
          </CardBody>
        </Card>
      );
    }
  };

}
