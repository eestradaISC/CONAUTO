

/**
 *@author Erick Raul Estrada Acosta
 *@NApiVersion 2.1
 *@Name _mr_.js
 *@description Map/Reduce 
 *@NScriptType MapReduceScript
 *@NAmdConfig
 */
define(["N/search", "N/runtime", "N/file", "N/encode"], (search, runtime, file, encode) => {
    const handlers = {};

    /**
     * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
     * @param {Object} inputContext
     * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {Object} inputContext.ObjectRef - Object that references the input data
     * @typedef {Object} ObjectRef
     * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
     * @property {string} ObjectRef.type - Type of the record instance that contains the input data
     * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
     * @since 2015.2
     */
    handlers.getInputData = () => {
        let result = [];
        let sFilters = [];
        let searchResult;
        try {
            let scriptObj = runtime.getCurrentScript();
            let startDate = scriptObj.getParameter({ name: 'custscript_con_fecha_inicio' });
            let endDate = scriptObj.getParameter({ name: 'custscript_con_fecha_fin' });
            log.debug("Fechas", { startDate: startDate, endDate: endDate })
            if (startDate && endDate) {
                sFilters.push(["created", "within", `01/01/2024 12:00 am`, `31/01/2024 11:59 pm`])
            }
            let searchObj = search.create({
                type: "customrecord_log_service_conauto",
                filters: sFilters,
                columns:
                    [
                        search.createColumn({
                            name: "id",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({ name: "custrecord_log_serv_type", label: "TIPO" }),
                        search.createColumn({ name: "custrecord_log_serv_idnot", label: "NOTIFICACIÓN ID" }),
                        search.createColumn({ name: "custrecord_log_serv_folio", label: "FOLIOS" }),
                        search.createColumn({ name: "custrecord_log_serv_length", label: "# PAGOS" }),
                        search.createColumn({ name: "custrecord_log_serv_request", label: "SOLICITUD" }),
                        search.createColumn({ name: "custrecord_log_serv_response", label: "RESPUESTA" }),
                        search.createColumn({ name: "custrecord_log_serv_success", label: "RECIBIDO EXITOSAMENTE" }),
                        search.createColumn({ name: "custrecord_log_serv_processed", label: "PROCESADO EN NETSUITE" }),
                        search.createColumn({ name: "custrecord_log_serv_error", label: "ERROR" }),
                        search.createColumn({ name: "custrecord_con_payments_processed", label: "# PAGOS PROCESADOS" })
                    ]
            });
            let searchResultCount = searchObj.runPaged().count;
            log.debug("search result count", searchResultCount);
            let numIterations = Math.ceil(searchResultCount / 1000);
            log.debug("numIteration", numIterations);
            let startData = 0;
            let endData = 999;
            for (let numIteration = 0; numIteration < numIterations; numIteration++) {
                searchResult = searchObj.run().getRange({
                    start: startData,
                    end: endData
                });
                for (const resultS of searchResult) {
                    let logData = {};
                    logData.custrecord_log_serv_request = (resultS.getValue("custrecord_log_serv_request"));
                    logData.id = (resultS.getValue("id"));
                    logData.custrecord_log_serv_type = (resultS.getValue("custrecord_log_serv_type"));
                    logData.custrecord_log_serv_idnot = (resultS.getValue("custrecord_log_serv_idnot"));
                    logData.custrecord_log_serv_folio = (resultS.getText("custrecord_log_serv_folio"));
                    logData.custrecord_log_serv_success = (resultS.getValue("custrecord_log_serv_success"));
                    logData.custrecord_log_serv_processed = (resultS.getValue("custrecord_log_serv_processed"));
                    logData.custrecord_log_serv_error = (resultS.getValue("custrecord_log_serv_error"));
                    logData.custrecord_log_serv_length = (resultS.getValue("custrecord_log_serv_length"));
                    logData.custrecord_con_payments_processed = (resultS.getValue("custrecord_con_payments_processed"));
                    log.debug("LOG DATA", logData);
                    result.push(logData);
                }
                startData += 1000;
                endData += 1000;
            }

            return { "values": result }
        } catch (error) {
            log.error('ERROR getInputData', error);
        }
    }

    /**
     * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
     * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
     * context.
     * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
     *     is provided automatically based on the results of the getInputData stage.
     * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
     *     function on the current key-value pair
     * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
     *     pair
     * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {string} mapContext.key - Key to be processed during the map stage
     * @param {string} mapContext.value - Value to be processed during the map stage
     * @since 2015.2
     */
    handlers.map = (mapContext) => {
        let request = JSON.parse(mapContext.value);
        // log.audit('request - Map', JSON.stringify(request));
        try {
            for (let r in request) {
                // log.audit('Map65 - ', JSON.stringify({ key: r, value: request[r] }));
                mapContext.write({
                    key: r,
                    value: request[r]
                });
            }
        } catch (error) {
            log.error('ERROR MAP', error);
        }
    }

    /**
     * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
     * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
     * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
     *     provided automatically based on the results of the map stage.
     * @param {I1erator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
     *     reduce function on the current group
     * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
     * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {string} reduceContext.key - Key to be processed during the reduce stage
     * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
     *     for processing
     * @since 2015.2
     */
    handlers.reduce = (reduceContext) => {
        let xmlStr = "";
        let key = reduceContext.key;
        let request = JSON.parse(reduceContext.values);
        request = request instanceof Array ? request[0] : request;

        try {
            let content = file.load({
                id: request.custrecord_log_serv_request
            });
            xmlStr += `<Row>` +
                `<Cell><Data ss:Type="String"> ${request.id}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${request.custrecord_log_serv_type}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${request.custrecord_log_serv_idnot}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${request.custrecord_log_serv_folio}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${content.getContents()}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${request.custrecord_log_serv_success}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${request.custrecord_log_serv_processed}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${request.custrecord_log_serv_error}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${request.custrecord_log_serv_length}</Data></Cell>` +
                `<Cell><Data ss:Type="String"> ${request.custrecord_con_payments_processed}</Data></Cell>` +
                `</Row>`;
            reduceContext.write({ key: key, value: xmlStr });
        } catch (error) {
            log.audit('ERROR reduce', error);
        }
    }


    /**
     * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
     * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
     * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
     * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
     *     script
     * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
     * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
     * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
     * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
     *     script
     * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
     * @param {Object} summaryContext.inputSummary - Statistics about the input stage
     * @param {Object} summaryContext.mapSummary - Statistics about the map stage
     * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
     * @since 2015.2
     */
    handlers.summarize = (summaryContext) => {
        let xmlStr = `
        <?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
        <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:html="http://www.w3.org/TR/REC-html40">
        <Worksheet ss:Name="Informe">

        <Table>
        <Row>
            <Cell><Data ss:Type="String"> ID </Data></Cell>
            <Cell><Data ss:Type="String"> TIPO </Data></Cell>
            <Cell><Data ss:Type="String"> NOTIFICACIÓN ID </Data></Cell>
            <Cell><Data ss:Type="String"> FOLIOS </Data></Cell>
            <Cell><Data ss:Type="String"> SOLICITUD </Data></Cell>
            <Cell><Data ss:Type="String"> RECIBIDO EN NETSUITE </Data></Cell>
            <Cell><Data ss:Type="String"> PROCESADO EN NETSUITE </Data></Cell>
            <Cell><Data ss:Type="String"> ERROR </Data></Cell>
            <Cell><Data ss:Type="String"> # PAGOS </Data></Cell>
            <Cell><Data ss:Type="String"> # PAGOS PROCESADOS </Data></Cell>
        </Row>
        `;
        try {
            summaryContext.output.iterator().each(function (key, value) {
                xmlStr += value;
                return true;
            });
            xmlStr += '</Table></Worksheet></Workbook>';
            let base64EncodedString = encode.convert({

                string: xmlStr,

                inputEncoding: encode.Encoding.UTF_8,

                outputEncoding: encode.Encoding.BASE_64
            });
            //create file

            let xlsFile = file.create({

                name: `INFORME DE LOGS ${new Date()}.xls`,

                fileType: 'EXCEL',
                folder: 105851,

                contents: base64EncodedString
            });
            let xlsFileID = xlsFile.save()
            log.audit({
                title: "ARCHIVO DE INFORME",
                details: xlsFileID
            });
        } catch (error) {
            log.error("ERROR summarize", error);
        }

    }
    return handlers
});
