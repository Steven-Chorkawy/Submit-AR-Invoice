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
    console.log("MyCustomerCardComponent");
    console.log(props);

    this.state = {
      selectedCustomer: props.selectedCustomer
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ ...nextProps });
  }

  render() {
    console.log("Before Render");
    console.log(this.state.selectedCustomer);

    if (this.state.selectedCustomer == undefined) {
      return (<div key="123">Select a Customer</div>);
    }
    else {
      return (
        <Card key={this.state.selectedCustomer.Title} type="info">
          <CardBody>
            <CardTitle>{this.state.selectedCustomer.Title}</CardTitle>
          </CardBody>
        </Card>
      );
    }
  };

}
