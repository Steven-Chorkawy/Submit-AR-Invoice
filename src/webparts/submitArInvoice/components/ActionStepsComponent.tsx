import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Stepper, Step, CardSubtitle } from '@progress/kendo-react-layout';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';

import { ActivityItem, IActivityItemProps, Link, mergeStyleSets } from 'office-ui-fabric-react';
import Moment from 'react-moment';

import { IInvoiceAction } from './interface/MyInterfaces';
import { InvoiceActionResponseStatus, InvoiceActionRequestTypes } from './enums/MyEnums';

import { PersonaComponent } from './PersonaComponent';
import { PersonaSize } from '@fluentui/react';


interface IActionStepsComponentProps {
    actions: Array<IInvoiceAction>;
    onAddNewApproval?: any;
}

const classNames = mergeStyleSets({
    exampleRoot: {
        marginTop: '20px',
    },
    nameText: {
        fontWeight: 'bold',
    },
});

const parseActionType = (action) => {
    let output = 'k-i-info';
    switch (action.Request_x0020_Type) {
        case InvoiceActionRequestTypes.DepartmentApprovalRequired:
        case InvoiceActionRequestTypes.AccountantApprovalRequired:
        case InvoiceActionRequestTypes.AccountingClerkApprovalRequired:
            output = 'k-i-check';
            break;
        case InvoiceActionRequestTypes.EditRequired:
            output = 'k-i-edit';
            break;
        default:
            break;
    }

    if (action.Response_x0020_Status === InvoiceActionResponseStatus.Rejected || action.Response_x0020_Status === InvoiceActionResponseStatus.Denied) {
        output = 'k-i-close';
    }

    return output;
};

const CustomActionCard = (props) => {
    const [ShowMore, setShowMore] = React.useState(false);

    return (
        <Card style={{ marginBottom: '5px' }}>
            <CardBody className={
                props.Response_x0020_Status === InvoiceActionResponseStatus.Waiting ? 'k-state-info' :
                    props.Response_x0020_Status === InvoiceActionResponseStatus.Approved ? 'k-state-success' :
                        props.Response_x0020_Status === InvoiceActionResponseStatus.Denied || props.Response_x0020_Status === InvoiceActionResponseStatus.Rejected ? 'k-state-error' :
                            ''
            }>
                <CardSubtitle>
                    <b title={props.Response_x0020_Status}><span className={`k-icon ${parseActionType(props)}`}></span> | {props.Request_x0020_Type}</b>
                </CardSubtitle>
            </CardBody>
            <CardBody style={{ wordWrap: 'break-word' }}>
                <div>
                    {props.Response_x0020_Status === InvoiceActionResponseStatus.Waiting ? `Waiting for ` : `${props.Response_x0020_Status} by `}
                    <b>{props.AssignedTo.Title} </b> 
                    <Moment
                        className={'k-card-subtitle'}
                        date={props.Modified}      // The date to be used.
                        format={'MM/DD/YYYY'}       // Date format. 
                        withTitle={true}            // Show Title on hover.
                        titleFormat={'D MMM YYYY'}  // Title format
                        fromNow={true}              // Display number of hours since date.
                        fromNowDuring={7200000}    // Only display fromNow if it is less than the milliseconds provided here. 7200000 = 2 hours.
                    />
                </div>
                {
                    props.Response_x0020_Message && <div>{props.Response_x0020_Message}</div>
                }
            </CardBody>
            {
                ShowMore &&
                <CardBody style={{ wordWrap: 'break-word' }}>
                    <div>
                        Requested by <b>{props.Author.Title} </b> 
                        <Moment
                            className={'k-card-subtitle'}
                            date={props.Created}        // The date to be used.
                            format={'MM/DD/YYYY'}       // Date format. 
                            withTitle={true}            // Show Title on hover.
                            titleFormat={'D MMM YYYY'}  // Title format
                            fromNow={true}              // Display number of hours since date.
                            fromNowDuring={7200000}     // Only display fromNow if it is less than the milliseconds provided here. 7200000 = 2 hours.
                        />
                    </div>
                    <div>
                        {props.Body}
                    </div>
                </CardBody>
            }
            <CardActions orientation='vertical'>
                <Button look='flat' onClick={e => setShowMore(!ShowMore)}>{ShowMore ? 'Hide' : 'Show More'}</Button>
            </CardActions>
        </Card >
    );
};

export class ActionStepsComponent extends React.Component<IActionStepsComponentProps, any> {

    constructor(props) {
        super(props);
    }

    public render() {
        return (
            <div>
                {
                    this.props.onAddNewApproval &&
                    <Button onClick={this.props.onAddNewApproval} icon={'check'}>Request Approval</Button>
                }
                {this.props.actions.map(action => {
                    return (<CustomActionCard {...action} />);
                })}
                {
                    this.props.onAddNewApproval &&
                    <Button onClick={this.props.onAddNewApproval} icon={'check'}>Request Approval</Button>
                }
            </div>
        );
    }
}
