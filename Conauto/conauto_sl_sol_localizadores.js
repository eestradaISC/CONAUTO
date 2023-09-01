/**
* @author Ashanty Uh Canul
* @Modificacion <>
* @Name Conauto_sl_sol_localizadores.js
* @description
* @NApiVersion 2.x
* @NScriptType Suitelet
* @NModuleScope SameAccount
*/
define(['N/record', 'N/email', 'N/log', 'N/runtime', 'N/search'], function(record, email, log, runtime, search) {
    function onRequest(scriptContext) {
        var request = scriptContext.request;
        var parameters = scriptContext.request.parameters;
        var idRequestLocator = parameters.id;
        try{
            var requestLocatorData = getRequestLocatorData(idRequestLocator);
            if(requestLocatorData != null) {
                log.debug("requestLocatorData", requestLocatorData);
                if(requestLocatorData[0].delEmail && requestLocatorData[0].delEmail != 'No info'){
                    var bodyDel = createBodyDelVen(requestLocatorData[0]);
                    sendEmail(requestLocatorData[0].createdby, requestLocatorData[0].delEmail, bodyDel)
                }
                if(requestLocatorData[0].vendEmail && requestLocatorData[0].vendEmail != 'No info'){
                    var bodyVen = createBodyDelVen(requestLocatorData[0]);
                    sendEmail(requestLocatorData[0].createdby, requestLocatorData[0].vendEmail, bodyVen)
                }
                if(requestLocatorData[0].custEmail && requestLocatorData[0].custEmail != 'No info'){
                    var bodyCustomer = createBodyCustomer(requestLocatorData[0]);
                    sendEmail(requestLocatorData[0].createdby, requestLocatorData[0].custEmail, bodyCustomer)
                }
                scriptContext.response.write({
                    output: JSON.stringify({
                        code: 200,
                        msg: 'Transacción exitosa.'
                    })
                });
            } else {
                scriptContext.response.write({
                    output: JSON.stringify({
                        code: 301,
                        msg: 'No cuenta con localizadores que sean notificables.'
                    })
                });
            }
        } catch (e){
            scriptContext.response.write({
                output: JSON.stringify({
                    code: 400,
                    msg: e.message
                })
            });
        }
         
    }

    function getRequestLocatorData(idRequestLocator) {
        var requestLocatorData = [];
        var customrecord_conauto_sol_localizadoresSearchObj = search.create({
            type: "customrecord_conauto_sol_localizadores",
            filters:
            [
                ["internalidnumber","equalto",idRequestLocator],
                "AND", 
                ["custrecord_localizador_solicitud.custrecord_localizador_notificable","is","T"],
                "AND", 
                ["isinactive","is","F"],

            ],
            columns:
            [
                search.createColumn({name: "internalid", label: "ID interno"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_estado", label: "Estado"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_proveedor", label: "Proveedor"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_prov_correo", label: "Correo Proveedor"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_bid", label: "BID"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_distribuidor", label: "Distribuidor"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_dist_direc", label: "Dirección Distribuidor"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_dist_tel", label: "Teléfono Distribuidor"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_dist_correo", label: "Correo Distribuidor"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_unidad", label: "Unidad/Catalogo"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_unidad_desc", label: "Descripción Unidad"}),
                search.createColumn({
                   name: "custrecord_localizador_serie",
                   join: "CUSTRECORD_LOCALIZADOR_SOLICITUD",
                   label: "No SERIE"
                }),
                search.createColumn({name: "custrecord_conauto_sol_loc_folio", label: "Folio"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_cliente", label: "Cliente"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_cliente_tel", label: "Teléfono Cliente"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_cliente_corre", label: "Correo Cliente"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_cliente_usocf", label: "Uso de CFDI"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_importe_pagar", label: "Importe/Costo"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_tipo_pago", label: "Tipo de Pago"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_tipo_paquete", label: "Tipo de Paquete"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_meses", label: "Mes"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_imp_fac_con", label: "Importe Facturación Conauto"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_imp_fac_clien", label: "Importe Facturación Cliente"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_meses", label: "Meses"}),
                search.createColumn({name: "custrecord_conauto_sol_loc_responsable", label: "Responsable"})
            ]
        });
        var searchResultCount = customrecord_conauto_sol_localizadoresSearchObj.runPaged().count;
        if(searchResultCount >= 1) {
            customrecord_conauto_sol_localizadoresSearchObj.run().each(function(result){
                requestLocatorData.push({
                    status: result.getText({ name: 'custrecord_conauto_sol_loc_estado'}) || 'No info',
                    vendor: result.getValue({ name: 'custrecord_conauto_sol_loc_proveedor'}) || 'No info',
                    vendEmail: result.getValue({ name: 'custrecord_conauto_sol_loc_prov_correo'}) || 'No info',
                    folio: result.getValue({ name: 'custrecord_conauto_sol_loc_folio'}) || 'No info',
                    unity: result.getValue({ name: 'custrecord_conauto_sol_loc_unidad'}) || 'No info',
                    bid: result.getValue({ name: 'custrecord_conauto_sol_loc_bid'}) || 'No info',
                    delivery: result.getValue({ name: 'custrecord_conauto_sol_loc_distribuidor'}) || 'No info',
                    delAddress: result.getValue({ name: 'custrecord_conauto_sol_loc_dist_direc'}) || 'No info',
                    delPhone: result.getValue({ name: 'custrecord_conauto_sol_loc_dist_tel'}) || 'No info',
                    delEmail: result.getValue({ name: 'custrecord_conauto_sol_loc_dist_correo'}) || 'No info',
                    unity: result.getValue({ name: 'custrecord_conauto_sol_loc_unidad'}) || 'No info',
                    desc: result.getValue({ name: 'custrecord_conauto_sol_loc_unidad_desc'}) || 'No info',
                    serie: result.getValue({ name: 'custrecord_localizador_serie', join: 'CUSTRECORD_LOCALIZADOR_SOLICITUD'}) || 'No info',
                    customer: result.getText({ name: 'custrecord_conauto_sol_loc_cliente'}) || 'No info',
                    custPhone: result.getValue({ name: 'custrecord_conauto_sol_loc_cliente_tel'}) || 'No info',
                    custEmail: result.getValue({ name: 'custrecord_conauto_sol_loc_cliente_corre'}) || 'No info',
                    cfdiUsage: result.getText({ name: 'custrecord_conauto_sol_loc_cliente_usocf'}) || 'No info',
                    cost: result.getValue({ name: 'custrecord_conauto_sol_loc_importe_pagar'}) || 'No info',
                    paymentType: result.getText({ name: 'custrecord_conauto_sol_loc_tipo_pago'}) || 'No info',
                    packageType: result.getText({ name: 'custrecord_conauto_sol_loc_tipo_paquete'}) || 'No info',
                    costConauto: result.getValue({ name: 'custrecord_conauto_sol_loc_imp_fac_con'}) || 0.00,
                    costCustomer: result.getValue({ name: 'custrecord_conauto_sol_loc_imp_fac_clien'}) || 0.00,
                    month: result.getValue({ name: 'custrecord_conauto_sol_loc_meses'}),
                    createdby: result.getValue({ name: 'custrecord_conauto_sol_loc_responsable'})
                })
            });
        } else {
            requestLocatorData = null;
        }
        return requestLocatorData;
    }

    function sendEmail(author, recipient, body) {
        try{
            email.send({
                author: author,
                recipients : recipient,
                subject : 'Notificación Localizador',
                body : body
            });
            log.debug("email enviado", body);
        } catch (e) {
            log.Error("Error",e)
            throw new Error(e)
        }
    }

    function createBodyDelVen(locatorData) {
        var body = null;
        try {
            body = '<table><tbody><tr><th>Solicitud de Localizador</th></tr></tbody></table>';
            body += '<br>Te notificamos que tienes una solicitud de localizador en estado <b>'+locatorData.status+'</b> para el folio <b>'+locatorData.folio+'</b> y unidad <b>'+locatorData.unity+'</b>.';
            body += '<br>';
            body += '<br><b>Distribuidor</b>';
            body += '<br>BID : '+ locatorData.bid;
            body += '<br>Nombre del distribuidor : '+ locatorData.delivery;
            body += '<br>Dirección : '+ locatorData.delAddress;
            body += '<br>Teléfono : '+ locatorData.delPhone;
            body += '<br>Correo : '+ locatorData.delEmail;
            body += '<br>';
            body += '<br><b>Unidad</b>';
            body += '<br>Catálogo: '+ locatorData.unity;
            body += '<br>Descripción : '+ locatorData.desc;
            body += '<br>Serie : '+ locatorData.serie;
            body += '<br>';
            body += '<br><b>Cliente</b>';
            body += '<br>Folio : '+ locatorData.folio;
            body += '<br>Nombre del Cliente : '+ locatorData.customer;
            body += '<br>Teléfono : '+ locatorData.custPhone;
            body += '<br>Correo : '+ locatorData.custEmail;
            body += '<br>';
            body += '<br><b>Datos de Facturación</b>';
            body += '<br>Nombre/Razon Social : '+ locatorData.customer;
            body += '<br>Uso de CFDI : '+ locatorData.cfdiUsage;
            body += '<br>Importe a Facturar : '+ parseFloat(locatorData.cost).toFixed(2);
            body += '<br>Forma Tipo de Pago : '+ locatorData.paymentType;
            body += '<br>';
            body += '<br><b>Paquete Localizador</b>';
            body += '<br>Tipo de Paquete : '+ locatorData.packageType;
            body += '<br>Mes : '+ locatorData.month;
            body += '<br>Costo : '+ parseFloat(locatorData.cost).toFixed(2);
            body += '<br>Paga Conauto : '+ parseFloat(locatorData.costConauto).toFixed(2);
            body += '<br>Paga Cliente : '+ parseFloat(locatorData.costCustomer).toFixed(2);
            body += '<br>';
            body += '<br>&nbsp;';
        } catch (e) {
            log.Error("Error",e)
            throw new Error(e)
        }
        return body;
    }

    function createBodyCustomer(locatorData) {
        var body = null;
        try {
            body = '<table><tbody><tr><th>Solicitud de Localizador</th></tr></tbody></table>';
            body += '<br>Te notificamos que tienes una solicitud de localizador en estado <b>'+locatorData.status+'</b> para el folio <b>'+locatorData.folio+'</b> y unidad <b>'+locatorData.unity+'</b>.';
            body += '<br>';
            body += '<br><b>Unidad</b>';
            body += '<br>Catálogo: '+ locatorData.unity;
            body += '<br>Descripción : '+ locatorData.desc;
            body += '<br>Serie : '+ locatorData.serie;
            body += '<br>';
            body += '<br><b>Cliente</b>';
            body += '<br>Folio : '+ locatorData.folio;
            body += '<br>Nombre del Cliente : '+ locatorData.customer;
            body += '<br>Teléfono : '+ locatorData.custPhone;
            body += '<br>Correo : '+ locatorData.custEmail;
            body += '<br>';
            body += '<br><b>Datos de Facturación</b>';
            body += '<br>Nombre/Razon Social : '+ locatorData.customer;
            body += '<br>Uso de CFDI : '+ locatorData.cfdiUsage;
            body += '<br>Importe a Facturar : '+ parseFloat(locatorData.cost).toFixed(2);
            body += '<br>Forma Tipo de Pago : '+ locatorData.paymentType;
            body += '<br>';
            body += '<br><b>Paquete Localizador</b>';
            body += '<br>Tipo de Paquete : '+ locatorData.packageType;
            body += '<br>Mes : '+ locatorData.month;
            body += '<br>Costo : '+ parseFloat(locatorData.cost).toFixed(2);
            body += '<br>Paga Conauto : '+ parseFloat(locatorData.costConauto).toFixed(2);
            body += '<br>Paga Cliente : '+ parseFloat(locatorData.costCustomer).toFixed(2);
            body += '<br>';
            body += '<br>&nbsp;';
        } catch (e) {
            log.Error("Error",e)
            throw new Error(e)
        }
        return body;
    }
 
    return {
        onRequest: onRequest
    };     
});