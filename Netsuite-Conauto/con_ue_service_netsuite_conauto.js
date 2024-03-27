/**
* @author Ashanty Uh Canul
* @Modificacion <>
* @Name con_ue_service_netsuite_conauto.js
* @description
* @NApiVersion 2.1
* @NScriptType UserEventScript
*/
define([
    'N/record',
    'N/task',
    'N/https',
    'N/file',
    'N/encode'], (
        record,
        task,
        https,
        file,
        encode,
    ) => {
    /**
     * Defines the function definition that is executed before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @param {Form} scriptContext.form - Current form
     * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
     * @since 2015.2
     */
    const beforeLoad = (scriptContext) => { }

    /**
     * Defines the function definition that is executed before record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @since 2015.2
     */
    const beforeSubmit = (scriptContext) => { }

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (scriptContext) => {
        if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
            log.debug('scriptContext.type', scriptContext.type);

            let logId = scriptContext.newRecord.id;
            let recordType = scriptContext.newRecord.type;
            let logType = scriptContext.newRecord.getValue({ fieldId: 'custrecord_log_serv_type' });
            let success = scriptContext.newRecord.getValue({ fieldId: 'custrecord_log_serv_success' });
            let processed = scriptContext.newRecord.getValue({ fieldId: 'custrecord_log_serv_processed' });
            log.debug('logType', logType);
            if (success && !processed) {
                try {
                    switch (logType) {
                        case 'PrimerasCuotas':
                            let taskServicePC = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_con_mr_service_ns_conauto',
                                params: {
                                    custscript_log_service_id_mr: logId
                                }
                            });
                            taskServicePC.submit();
                            break;
                        case 'SolicitudPago':
                            let taskServicePI = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_con_mr_service_ns_conauto',
                                params: {
                                    custscript_log_service_id_mr: logId
                                }
                            });
                            taskServicePI.submit();
                            break;
                        case 'ActualizaContrato':
                            let taskServiceAC = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceAC.submit();
                            break;
                        case 'CesionDerechos':
                            let taskServiceCD = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceCD.submit();
                            break;
                        case 'InteresesMoratorios':
                            let taskServiceIM = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceIM.submit();
                            break;
                        case 'ReservaPasivo':
                            let taskServiceRP = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceRP.submit();
                            break;
                        case 'Bajas':
                            let taskServiceBJ = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceBJ.submit();
                            break;
                        case 'ModificacionBajas':
                            let taskServiceMB = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceMB.submit();
                            break;
                        case 'ComplementoBajas':
                            let taskServiceCB = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceCB.submit();
                            break;
                        case 'AplicacionCobranza':
                            let taskServiceApC = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_con_mr_service_ns_conauto',
                                params: {
                                    custscript_log_service_id_mr: logId
                                }
                            });
                            taskServiceApC.submit();
                            break;
                        case 'ReclasificacionPrimeraCuota':
                            let taskServiceRPC = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceRPC.submit();
                            break;
                        case 'ProvisionCartera':
                            let taskServicePCar = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_con_mr_service_ns_conauto',
                                params: {
                                    custscript_log_service_id_mr: logId
                                }
                            });
                            taskServicePCar.submit();
                            break;
                        case 'CambiarEstatus':
                            let taskServiceCE = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServiceCE.submit();
                            break;
                        case 'PolizaIntegrantes':
                            let taskServicePOLINT = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServicePOLINT.submit();
                            break;
                        case 'PagoUnidad':
                            let taskServicePAUN = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_con_sc_service_ns_conauto',
                                params: {
                                    custscript_log_service_id: logId
                                }
                            });
                            taskServicePAUN.submit();
                            break;
                        case 'CobranzaIdentificada':
                            let taskServiceCIDEN = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_con_mr_service_ns_conauto',
                                params: {
                                    custscript_log_service_id_mr: logId
                                }
                            });
                            taskServiceCIDEN.submit();
                            break;

                    }
                } catch (e) {
                    handlerErrorLogRequest(e.message.toString(), logId, recordType)
                }
            }
        }
    }

    function handlerErrorLogRequest(e, logId, recordType) {
        if (logId) {
            log.error({
                title: 'ERRORHANDLER',
                details: 'LOG ID: ' + logId + ', ' + e
            });
            record.submitFields({
                type: recordType,
                id: logId,
                values: {
                    custrecord_log_serv_error: e,
                    custrecord_log_serv_success: true,
                    custrecord_log_serv_processed: true
                }
            })
        }
        return logId;
    }

    return { beforeLoad, beforeSubmit, afterSubmit }
});
