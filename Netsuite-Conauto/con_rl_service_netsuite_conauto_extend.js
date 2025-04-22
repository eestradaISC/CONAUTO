/**
* @author Erick Raul Estrada Acosta eestradaa@conauto.com.mx
* @Modificacion <>
* @Name con_rl_service_netsuite_conauto_extend.js
* @description Servicio de conexión entre Progress y Netsuite Parte 2
* @file <URL PENDIENTE>
* @NApiVersion 2.1
* @NScriptType Restlet
* @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
*/
define([
    'N/record',
    'N/file',
    'IMR/IMRSearch',
    '/SuiteScripts/Conauto_Preferences.js',
    "/SuiteScripts/con_lib_service_netsuite.js"
],
    (record, file, search, conautoPreferences, lib_conauto) => {

        /**
        * @param request
        *        {String|Object} The request body as a String when
        *            <code>Content-Type</code> is <code>text/plain</code>; The
        *            request body as an Object when request
        *            <code>Content-Type</code> is <code>application/json</code>
        *
        * @return {String|Object} Returns a String when request
        *         <code>Content-Type</code> is <code>text/plain</code>;
        *         returns an Object when request <code>Content-Type</code> is
        *         <code>application/json</code>
        *
        * @static
        * @function post
        */
        function postRequest(request) {
            let response = { code: 300, info: [] };
            try {
                let data = request || {};
                let operations = {
                    'ActualizaFactura': actualizaFactura,
                    'FacturasNoTimbradas': facturasNoTimbradas
                }
                let callback = operations[data.tipo];
                if (callback) {
                    try {
                        callback(data, response);
                    } catch (e) {
                        response.code = 400;
                        response.info.push('ERROR POST REQUEST: ' + e.toString());
                    }
                } else {
                    response = { code: 404, info: ['OPERACIÓN ' + data.tipo + ' INVÁLIDA'] };
                }
                successRequest(response);
            } catch (e) {
                response.code = 500;
                response.info.push('ERROR POST REQUEST: ' + e.toString());
            }
            return response;
        }

        /**
        * @param {Object} data
        * @param {String} data.tipo 
        * @param {String} data.idNotificacion 
        * @param {Array}  data.montoTotal 
        * @param {Array}  data.numerodeOperaciones
        * @param {Array}  data.pagos 
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array}  response.info
        * 
        * 
        */
        function actualizaFactura(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            if (logId) {
                let mandatoryFields = ['folio', 'idFactura', 'idCliente', "regimen", "cp", "usoCFDI", "nombre", "esPersona", "rfc"];
                checkMandatoryFields(data, mandatoryFields, response, 0);
                checkMandatoryFieldsDate(data, ['fecha'], response);
                let folioId = lib_conauto.recordFind('customrecord_cseg_folio_conauto', 'anyof', 'externalid', data.folio) || lib_conauto.recordFind('customrecord_cseg_folio_conauto', 'is', 'name', data.folio);
                if (!folioId) {
                    response.code = 400;
                    response.info.push('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID O NAME, VERIFICA EL REGISTRO DEL FOLIO');
                    handlerErrorLogRequest('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID O NAME, VERIFICA EL REGISTRO DEL FOLIO', logId);
                }
            } else {
                response.code = 400;
                response.info.push('NO SE LOGRO GENERAR LA PETICIÓN PARA FACTURAS A ACTUALIZAR');
                handlerErrorLogRequest('NO SE LOGRO GENERAR LA PETICIÓN PARA FACTURAS A ACTUALIZAR', logId);
            }
        }

        /**
        * @param {Object} data
        * @param {String} data.tipo 
        * @param {String} data.idNotificacion 
        * @param {Array}  data.detalles 
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array}  response.info
        * 
        * 
        */
        function facturasNoTimbradas(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            if (!logId) {
                response.code = 400;
                response.info.push('NO SE LOGRO GENERAR LA PETICIÓN PARA FACTURAS NO TIMBRADAS');
                handlerErrorLogRequest('NO SE LOGRO GENERAR LA PETICIÓN PARA FACTURAS NO TIMBRADAS', logId);
            }
        }


        function createLog(data, response) {
            let logId = null;
            try {
                //Creación del log
                let logRecord = record.create({
                    type: 'customrecord_log_service_conauto'
                });
                //Tipo de Operación
                if (data.tipo) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_type',
                        value: data.tipo
                    });
                }
                //Id Notificación
                if (data.idNotificacion) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_idnot',
                        value: data.idNotificacion
                    });
                }
                //Numero de Pagos recibidos
                if (data.pagos && data.pagos.length > 0) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_length',
                        value: data.pagos.length
                    });
                }
                //Recibido en Netsuite
                logRecord.setValue({
                    fieldId: 'custrecord_log_serv_success',
                    value: true
                });
                //Solicitud
                const dateNow = new Date().getTime();
                let requestFile = file.create({
                    name: 'REQ_' + dateNow + '.json',
                    contents: JSON.stringify(data),
                    fileType: file.Type.JSON,
                    folder: 105850
                });
                let requestFileId = requestFile.save();
                //Respuesta
                let responseFile = file.create({
                    name: 'RES_' + dateNow + '.json',
                    contents: JSON.stringify(response),
                    fileType: file.Type.JSON,
                    folder: 105849
                });
                let responseFileId = responseFile.save();
                if (requestFileId && responseFileId) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_request',
                        value: requestFileId
                    });
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_response',
                        value: responseFileId
                    });
                }
                //Guardar Log
                logId = logRecord.save();
            } catch (e) {
                response.code = 500;
                response.info.push('ERROR CREATE LOG REQUEST: ' + e.message.toString());
                handlerErrorLogRequest('ERROR CREATE LOG REQUEST: ' + e.message.toString(), logId);
            }
            return logId;
        }

        function checkMandatoryFields(data, mandatoryFields, response, line) {
            for (let mandatoryField of mandatoryFields) {
                let value = data[mandatoryField];
                if (!(value || parseFloat(value) === 0 || util.isBoolean(value))) {
                    response.code = 302;
                    response.info.push((line ? ('LÍNEA ' + line + ': ') : '') + 'EL CAMPO ' + mandatoryField + ' NO DEBE ESTAR VACÍO');
                }
            }
        }

        function checkMandatoryFieldsDate(data, mandatoryFields, response, line) {
            for (let mandatoryField of mandatoryFields) {
                let value = data[mandatoryField] || '';
                if (!validarFecha(value) && value) {
                    response.code = 310;
                    response.info.push((line ? ('LÍNEA ' + line + ': ') : '') + 'EL CAMPO ' + mandatoryField + ' NO TIENE UN FORMATO DE FECHA VÁLIDO: DD/MM/YYYY');
                }
            }
        }

        function validarFecha(fecha) {
            // Utilizamos una expresión regular para verificar el formato DD/MM/YYYY
            let patronFecha = /^\d{2}\/\d{2}\/\d{4}$/;
            let estado = true;

            if (patronFecha.test(fecha)) {
                // Verificamos que el día, mes y año sean válidos
                let dia = parseInt(fecha.substring(0, 2), 10);
                let mes = parseInt(fecha.substring(3, 5), 10);
                let anio = parseInt(fecha.substring(6), 10);

                if (mes < 1 || mes > 12) {
                    estado = false;
                }

                let diasPorMes = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

                if (anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0)) {
                    diasPorMes[2] = 29; // Si es año bisiesto, febrero tiene 29 días
                }

                if (dia < 1 || dia > diasPorMes[mes]) {
                    estado = false;
                }

                estado = true;
            } else {
                estado = false;
            }

            return estado;
        }

        function stringToDateConauto(value) {
            if (value) {
                let arrayDate = value.split("/");
                return new Date(arrayDate[2], arrayDate[1] - 1, arrayDate[0]);
            } else {
                return null;
            }
        }

        function handlerErrorLogRequest(e, logId) {
            if (logId) {
                log.error({
                    title: 'ERRORHANDLER',
                    details: 'LOG ID: ' + logId + ', ' + e
                });
                record.submitFields({
                    type: 'customrecord_log_service_conauto',
                    id: logId,
                    values: {
                        custrecord_log_serv_processed: true,
                        custrecord_log_serv_error: e
                    }
                })
            }
            return logId;
        }

        function successRequest(response) {
            if (response.code == 300) {
                response.code = 200;
                response.info.push('Petición Exitosa');
            } else {
                handlerErrorLogRequest('ERROR REQUEST: ' + response.info, response.logId);
            }

        }

        return { post: postRequest }

    });