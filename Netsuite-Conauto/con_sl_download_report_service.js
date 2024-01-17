/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(
    [
        "N/search",
        "N/file",
        "N/encode"
    ],
    function (search, file, encode) {

        /**
        * @param {SuiteletContext.onRequest} context
        */
        function onRequest(context) {
            let xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';

            xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';

            xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';

            xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';

            xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';

            xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
            xmlStr += '<Worksheet ss:Name="Informe">';

            xmlStr += '<Table>' +

                '<Row>' +

                '<Cell><Data ss:Type="String"> ID </Data></Cell>' +

                '<Cell><Data ss:Type="String"> TIPO </Data></Cell>' +

                '<Cell><Data ss:Type="String"> NOTIFICACIÓN ID </Data></Cell>' +

                '<Cell><Data ss:Type="String"> FOLIOS </Data></Cell>' +

                '<Cell><Data ss:Type="String"> SOLICITUD </Data></Cell>' +

                '<Cell><Data ss:Type="String"> RECIBIDO EN NETSUITE </Data></Cell>' +

                '<Cell><Data ss:Type="String"> PROCESADO EN NETSUITE </Data></Cell>' +

                '<Cell><Data ss:Type="String"> ERROR </Data></Cell>' +

                '<Cell><Data ss:Type="String"> # PAGOS </Data></Cell>' +

                '<Cell><Data ss:Type="String"> # PAGOS PROCESADOS </Data></Cell>' +

                '</Row>';

            let customrecord_log_service_conautoSearchObj = search.create({
                type: "customrecord_log_service_conauto",
                filters:
                    [
                    ],
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
            let searchResultCount = customrecord_log_service_conautoSearchObj.runPaged().count;
            log.debug("customrecord_log_service_conautoSearchObj result count", searchResultCount);
            customrecord_log_service_conautoSearchObj.run().each(function (result) {
                let content = file.load({
                    id: result.getValue("custrecord_log_serv_request")
                });
                xmlStr += `<Row>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("id")}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("custrecord_log_serv_type")}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("custrecord_log_serv_idnot")}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("custrecord_log_serv_folio")}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${content.getContents()}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("custrecord_log_serv_success")}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("custrecord_log_serv_processed")}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("custrecord_log_serv_error")}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("custrecord_log_serv_length")}</Data></Cell>` +
                    `<Cell><Data ss:Type="String"> ${result.getValue("custrecord_con_payments_processed")}</Data></Cell>` +
                    `</Row>`;

                log.audit({
                    title: `Contenido del json ${result.getValue("id")}`,
                    details: content
                })
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

                name: 'INFORME.xls',

                fileType: 'EXCEL',
                folder: 105851,

                contents: base64EncodedString
            });
            let xlsFileID = xlsFile.save()
            log.audit({
                title: "ARCHIVO DE INFORME",
                details: xlsFileID
            });

        }
        return {
            onRequest: onRequest
        };
    });
