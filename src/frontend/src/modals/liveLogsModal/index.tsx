import { useGetTransactionsQuery } from "@/controllers/API/queries/transactions";
import { ColDef, ColGroupDef } from "ag-grid-community";
import { ScrollArea } from "@/components/ui/scrollArea";
import { cn } from "@/utils/utils";
import { useEffect, useRef, useState } from "react";
import IconComponent from "../../components/genericIconComponent";
import TableComponent from "../../components/tableComponent";
import useFlowsManagerStore from "../../stores/flowsManagerStore";
import { FlowSettingsPropsType } from "../../types/components";
import BaseModal from "../baseModal";

export default function LiveLogsModal({
  open,
  setOpen,
}: FlowSettingsPropsType): JSX.Element {
  const currentFlowId = useFlowsManagerStore((state) => state.currentFlowId);

  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Specify that eventSourceRef.current can be an EventSource or null
  const eventSourceRef = useRef<EventSource | null>(null);

  const startSSE = () => {
    if (!isStreaming) {
      eventSourceRef.current = new EventSource('/logs-stream');

      eventSourceRef.current.onmessage = (event) => {
        const newLog = event.data;

        setLogs((prevLogs) => [newLog, ...prevLogs]);
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('Error with SSE connection', error);
        stopSSE();
      };

      setIsStreaming(true);
    }
  };

  const stopSSE = () => {
    console.log('stop')
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      stopSSE();
    };
  }, []);

  return (
    <BaseModal open={open} setOpen={setOpen} size="x-large">
      <BaseModal.Header description="Inspect component executions.">
        <div className="flex w-full justify-between">
          <div className="flex h-fit w-32 items-center">
            <span className="pr-2">Logs</span>
            <IconComponent name="ScrollText" className="mr-2 h-4 w-4" />
          </div>
          <div className="flex h-fit w-32 items-center"></div>
        </div>
      </BaseModal.Header>
      <BaseModal.Content>
        <div>
          <h3>Live Logs</h3>
          <div style={{ marginBottom: '10px' }}>
            {isStreaming ? (
              <button onClick={stopSSE} disabled={!isStreaming}>Pause</button>
            ): (
              <button onClick={startSSE} disabled={isStreaming}>Play</button>
            )}
          </div>
          <ScrollArea className="h-96 w-full text-sm p-4 rounded-lg shadow-md">
            <div className="space-y-2">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className={cn("whitespace-pre-wrap")}>
                    {log}
                  </div>
                ))
              ) : (
                <p>No logs available</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </BaseModal.Content>
    </BaseModal>
  );
}
