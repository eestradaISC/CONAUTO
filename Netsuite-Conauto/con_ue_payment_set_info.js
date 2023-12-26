/**
* @author Erick Raul Estrada Acosta
* @Modificacion <>
* @Name con_ue_payment_set_info.js
* @description Evento de usuario que setea el folio, ubicación y grupo
* @NApiVersion 2.1
* @NScriptType UserEventScript
*/
define([
    'N/record',
    'N/search',
    'N/task',], (
        record,
        search,
        task,
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
    const beforeSubmit = (scriptContext) => {
        if (scriptContext.type == 'create') {
            log.debug('scriptContext.type', scriptContext.type);
            let totalLines = scriptContext.newRecord.getLineCount({
                sublistId: 'apply'
            });

            for (let line = 0; line < totalLines; line++) {
                let isApply = scriptContext.newRecord.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply',
                    line: line
                })
                if (!isApply) continue
                let invoiceId = scriptContext.newRecord.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'internalid',
                    line: line
                });

                let invoiceObj
                try {
                    invoiceObj = record.load({
                        type: 'vendorbill',
                        id: invoiceId,
                        isDynamic: false
                    });
                    let folio = invoiceObj.getValue({
                        fieldId: "cseg_folio_conauto"
                    });
                    let group = invoiceObj.getValue({
                        fieldId: "cseg_grupo_conauto"
                    });

                    scriptContext.newRecord.setValue({
                        fieldId: 'cseg_folio_conauto',
                        value: folio,
                        ignoreFieldChange: true
                    });

                    scriptContext.newRecord.setValue({
                        fieldId: 'cseg_grupo_conauto',
                        value: group,
                        ignoreFieldChange: true
                    });

                    scriptContext.newRecord.setValue({
                        fieldId: 'location',
                        value: 6,
                        ignoreFieldChange: true
                    });

                    let memo = invoiceObj.getValue({
                        fieldId: 'memo'
                    });

                    let entityId = scriptContext.newRecord.getValue({
                        fieldId: 'entity'
                    });

                    let razonsocial = search.lookupFields({
                        type: 'vendor',
                        id: Number(entityId),
                        columns: 'custentity_razon_social'
                    }).custentity_razon_social;

                    memo = `${memo}, no. de cheque Undefined TranId, razón social ${razonsocial}`;

                    log.error("MEMO", memo)

                    scriptContext.newRecord.setValue({
                        fieldId: 'memo',
                        value: memo,
                        ignoreFieldChange: true
                    });

                    break;
                } catch (error) {
                    log.error("ES UN DIARIO", error)
                }


            }
        }
    }

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (scriptContext) => {
        try {
            log.error("SI LLEGA PERO NO PASA", scriptContext.type)
            if (scriptContext.type == 'paybills') {
                let newRecord = record.load({
                    type: scriptContext.newRecord.type,
                    id: scriptContext.newRecord.id
                });

                let numcheque = newRecord.getValue("tranid");
                let memo = String(newRecord.getText("memo"));
                log.error("MEMO BEFORE REPLACE", numcheque);
                memo = memo.replace("Undefined TranId", numcheque);
                log.error("MEMO AFTER", memo);
                newRecord.setValue({
                    fieldId: "memo",
                    value: memo,
                    ignoreFieldChange: true
                });

                newRecord.save({
                    ignoreMandatoryFields: true
                });
            }
        } catch (error) {
            log.error("ERROR EN CARGAR NÚMERO DE CHEQUE", error)
        }

    }

    return { beforeLoad, beforeSubmit, afterSubmit }
});
