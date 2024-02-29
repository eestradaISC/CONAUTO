/**
 * @author Erick Raul Estrada Acosta
 * @Name con_ue_add_externalid_folio.js
 * @description UserEvent que setea el folio en el externalid
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record"],
    /**
     * @param {import('N/record')} record
     */
    function (record) {

        const entryPoints = {}

        entryPoints.afterSubmit = (context) => {
            try {
                let newRecord = context.newRecord;
                let folio = newRecord.getValue({
                    fieldId: "name"
                })
                let recordID = record.submitFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    values: {
                        "externalid": folio
                    }
                })
                log.audit({
                    title: "RECORD",
                    details: recordID
                })
            } catch (error) {
                log.error("ERROR IN BEFORE SUBMIT")
            }
        }


        return entryPoints

    });