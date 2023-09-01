/**
* @author Ashanty Uh Canul 
* @Modificacion <>
* @Name Conauto_ue_sol_localizadores.js
* @description
* @NApiVersion 2.x
* @NScriptType UserEventScript
*/
define(['N/runtime', 'N/record'], function(runtime, record) {

    function beforeLoad(scriptContext) {
        var form = scriptContext.form;
        var requestLocator = scriptContext.newRecord;
        form.clientScriptModulePath = './conauto_cs_sol_localizadores.js'
            //Botón para notificación
            if(scriptContext.type == scriptContext.UserEventType.VIEW){
                form.addButton({
                id: 'custpage_send_email',
                label: "Notificar",
                functionName: 'requestEmail('+requestLocator.id+')'
            })
        }
    }

    function afterSubmit(scriptContext) {
        try {
            var nrecord = scriptContext.newRecord;
            var status = nrecord.getValue({ fieldId: 'custrecord_conauto_sol_loc_estado'});
            var purchase = nrecord.getValue({ fieldId: 'custrecord_conauto_sol_loc_ordencompra'});
            if(status == 2 && !purchase) {
                // Creación de la orden de compra cuando es estado instalado y no se tiene una orden de compra asignada
                var purchOrderId = createPO(nrecord);
                // Asignación de la orden de compra en el registro
                if(purchOrderId != null){
                    record.submitFields({
                        type: 'customrecord_conauto_sol_localizadores',
                        id: nrecord.id,
                        values: {
                            'custrecord_conauto_sol_loc_ordencompra': purchOrderId
                        }
                    });
                }
            }
        } catch (e) {
            throw new Error(e)
        }
    }

    function createPO(nrecord) {
        var purchOrderId = null;
        try {
            var vendor = nrecord.getValue({ fieldId : 'custrecord_conauto_sol_loc_proveedor'});
            var employee = nrecord.getValue({ fieldId : 'custrecord_conauto_sol_loc_responsable'});
            var approver = nrecord.getValue({ fieldId: 'custrecord_conauto_sol_loc_aprobador'});
            var memo = nrecord.getValue({ fieldId: 'custrecord_conauto_sol_loc_observaciones'});
            var amount = nrecord.getValue({ fieldId: 'custrecord_conauto_sol_loc_importe_pagar'});
            log.debug("amount",amount)
            var amountConauto = nrecord.getValue({ fieldId: 'custrecord_conauto_sol_loc_imp_fac_con'});
            var description = nrecord.getValue({ fieldId: 'custrecord_conauto_sol_loc_unidad'});
            var paymentType = nrecord.getText({ fieldId: 'custrecord_conauto_sol_loc_tipo_pago'})
            if(paymentType){
                if(paymentType === 'Conauto'){
                    var purchOrder = record.create({type: record.Type.PURCHASE_ORDER, isDynamic: true});
                    purchOrder.setValue({fieldId: 'entity',value: vendor});
                    purchOrder.setValue({fieldId: 'employee',value: employee});
                    purchOrder.setValue({fieldId: 'memo',value: memo});
                    purchOrder.setValue({fieldId: 'approvalstatus',value: 1});
                    purchOrder.setValue({fieldId: 'custbody_aprobador_pedido',value: approver});
                    purchOrder.selectNewLine({sublistId: 'item'});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value: 1906});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'description', value: description});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: 1});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'rate', value: amount});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'amount', value: amount});
                    purchOrder.commitLine({sublistId: 'item'});
                    purchOrderId = purchOrder.save();
                    log.debug("purchOrderId", purchOrderId);
                } else if(paymentType === 'Conauto/Cliente') {
                    var purchOrder = record.create({type: record.Type.PURCHASE_ORDER, isDynamic: true});
                    purchOrder.setValue({fieldId: 'entity',value: vendor});
                    purchOrder.setValue({fieldId: 'employee',value: employee});
                    purchOrder.setValue({fieldId: 'memo',value: memo});
                    purchOrder.setValue({fieldId: 'approvalstatus',value: 1});
                    purchOrder.setValue({fieldId: 'custbody_aprobador_pedido',value: approver});
                    purchOrder.selectNewLine({sublistId: 'item'});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value: 1906});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'description', value: description});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: 1});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'rate', value: amountConauto});
                    purchOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'amount', value: amountConauto});
                    purchOrder.commitLine({sublistId: 'item'});
                    purchOrderId = purchOrder.save();
                    log.debug("purchOrderId", purchOrderId);
                } else if(paymentType === 'Cliente') {
                    purchOrderId = null;
                    log.debug("purchOrderId", 'It does not exist because the client has covered the entire package.');
                }  
            }   
        } catch (e) {
            throw new Error(e)
        }
        return purchOrderId;
    }

    return {
        afterSubmit: afterSubmit,
        beforeLoad: beforeLoad
    }

});
