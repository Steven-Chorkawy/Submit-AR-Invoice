import * as React from 'react';
import * as ReactDom from 'react-dom';

import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Pager } from '@progress/kendo-react-data-tools';
import { Button } from '@progress/kendo-react-buttons';

class ARListViewItem extends React.Component<any, any> {
    constructor(props) {
        super(props);
    }



    public render() {
        return (
            <Card type={this.props.index % 2 === 0 ? 'info' : 'error'}
                key={this.props.dataItem.ID}
                orientation={this.props.index % 2 === 0 ? 'horizontal' : 'vertical'}
                style={{ borderWidth: '0px 0px 1px', width: '100%', marginBottom: '2px' }}
            >
                <CardBody>
                    <div className='row p-2 border-bottom align-middle' style={{ margin: 0 }}>
                        <div className='col-sm-2'>
                            ID: {this.props.item.ID}
                        </div>
                        <div className='col-sm-6'>
                            <h2 style={{ fontSize: 14, color: '#454545', marginBottom: 0, marginTop: 0 }} className="text-uppercase">name</h2>
                            <div style={{ fontSize: 12, color: "#a0a0a0" }}>email</div>
                        </div>
                        <div className='col-sm-4'>
                            <div className='k-chip k-chip-filled'>
                                <div className='k-chip-content'>new messages</div>
                            </div>
                        </div>
                    </div>
                </CardBody>

                {this.props.showMore &&
                    <div>
                        <CardBody>
                            <p>Card body 2</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 3</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 4</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 5</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 6</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 7</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 8</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 9</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 10</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 11</p>
                        </CardBody>
                        <CardBody>
                            <p>Card body 12</p>
                        </CardBody>
                    </div>
                }

                <CardActions>
                    <Button className='k-button k-bare' onClick={(e) => {
                        console.log(e);
                    }} >1</Button>
                    <button className='k-button k-bare'>2</button>
                    <button className='k-button k-bare'>3</button>
                    <button className='k-button k-bare'>4</button>
                </CardActions>
            </Card>
        );
    }
}


export { ARListViewItem };
