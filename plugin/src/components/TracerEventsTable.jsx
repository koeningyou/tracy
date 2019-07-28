/* global chrome */
import React, { Component } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import * as utils from "../utils";

export default class TracerEventsTable extends Component {
  componentDidMount() {
    const port = chrome.runtime.connect({ name: "TracerEventsTable" });
    port.onMessage.addListener(msg => {
      switch (Object.keys(msg).pop()) {
        case "addEvent":
          const event = Object.values(msg).pop().event;
          // Only add an event if it belongs to the tracer currently selected.
          if (event.TracerPayload !== this.props.selectedTracerPayload) {
            return;
          }
          this.props.addEvent(event, false);
          break;
        default:
          break;
      }
    });
    port.onDisconnect.addListener(() => console.log("disconnected"));
    this.refresh();
  }
  refresh = async () => {
    const events = await utils.getTracerEvents(
      this.props.selectedTracerPayload
    );
    this.props.updateEvents(events);
  };
  render = () => {
    if (this.props.loading) {
      this.refresh();
    }
    let data = this.props.events;
    if (this.props.filterTextNodes) {
      data = data.filter(utils.filterTextNodes);
    }

    return (
      <div className="table-container table-container-events">
        <span className="filler" />
        <ReactTable
          className="grow-table"
          data={data}
          showPageSizeOptions={false}
          showPageJump={false}
          loading={
            this.props.loading || this.props.selectedTracerPayload === ""
          }
          loadingText={
            this.props.loading
              ? "loading..."
              : "click a tracer for more details"
          }
          columns={[
            {
              Header: "observed outputs",
              columns: [
                { Header: "id", accessor: "ID", width: 45 },
                { Header: "url", accessor: "EventURL" },
                {
                  Header: "type",
                  accessor: "EventType"
                },
                {
                  Header: "sev",
                  accessor: "Severity",
                  width: 45
                }
              ]
            }
          ]}
          getTrProps={(state, rowInfo, column, instance) => {
            if (rowInfo) {
              let classname = "";
              switch (rowInfo.row.Severity) {
                case 1:
                  classname = "suspicious";
                  break;
                case 2:
                  classname = "probable";
                  break;
                case 3:
                  classname = "exploitable";
                  break;
                default:
                  classname = "unexploitable";
              }

              if (rowInfo.row.ID === this.props.selectedEventID) {
                classname += " row-selected";
              }

              return {
                onClick: (e, handleOriginal) => {
                  this.props.selectEvent(rowInfo.row.ID);

                  if (handleOriginal) {
                    handleOriginal();
                  }
                },
                className: classname
              };
            } else {
              return {};
            }
          }}
          defaultSorted={[
            {
              id: "id",
              desc: true
            }
          ]}
        />
      </div>
    );
  };
}
