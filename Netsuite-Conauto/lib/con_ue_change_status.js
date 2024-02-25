/**
 * @author Erick Raul Estrada Acosta
 * @Name con_ue_change_status.js
 * @description UserEvent 
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/search', 'N/runtime', "N/ui/serverWidget"],
    /**
     * @param {import('N/record')} record
     * @param {import('N/search')} search
     * @param {import('N/runtime')} runtime
     * @param {import('N/ui/serverWidget')} serverWidget
     */
    function (record, search, runtime, serverWidget) {

        const entryPoints = {}


        entryPoints.beforeLoad = (context) => {
            try {
                //TODO: CODE HERE
            } catch (error) {
                log.error("ERROR IN BEFORE LOAD", error)
            }
        }

        entryPoints.beforeSubmit = (context) => {
            try {
                //TODO: CODE HERE
                let newRecord = context.newRecord;
                log.debug("STAT?US", newRecord.getValue({
                    fieldId: "statusRef",
                    value: "paidInFull",
                    ignoreFieldChange: true
                }));
            } catch (error) {
                log.error("ERROR IN BEFORE SUBMIT")
            }
        }

        entryPoints.afterSubmit = (context) => {
            try {
                //TODO: CODE HERE
            } catch (error) {
                log.error("ERROR IN AFTER SUBMIT")
            }
        }


        return entryPoints

    });