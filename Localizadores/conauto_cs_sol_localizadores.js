/**
* @author Ashanty Uh Canul
* @Modificacion <>
* @Name Conauto_cs_sol_localizadores.js
* @description
* @NApiVersion 2.x
* @NScriptType ClientScript
*/
define(['N/search', 'N/url', 'N/https', 'N/ui/dialog', 'N/ui/message'], function (search, url, https, dialogAPI, messageAPI) {
    function showMessageStatus(title, message) {
        var msgStatus = messageAPI.create({
            title: title ? title : 'Generando notificación...',
            message: message ? message : 'Por favor espera, estamos generando tu notificación a los involucrados vía correo electrónico.',
            type : messageAPI.Type.INFORMATION
        });
        msgStatus.show();
        return msgStatus;
    }

    function alertPromise(title, message, url) {
        dialogAPI.alert({
            title: title,
            message: message
        }).then(function (result) {
            if (url) {
                window.open(url);
            } else {
                window.location.reload();
            }
        }).catch(function (error) {
            console.log("ERROR_MESSAGE", error);
        });
    }

    function fieldChanged(scriptContext) {
        try {
            var currentRecord = scriptContext.currentRecord;
			var fieldName = scriptContext.fieldId;		
			if (fieldName == 'custrecord_conauto_sol_loc_folio') {
                var folioId = currentRecord.getValue('custrecord_conauto_sol_loc_folio');
                var customerId = currentRecord.getValue('custrecord_conauto_sol_loc_cliente');
                if(!customerId){
                    customerId = getFolioData(folioId);
                }
                if(folioId && customerId) {
                    var locatorData = getLocatorData(folioId, customerId)
                    if(locatorData.nlocator != ''){
                        currentRecord.setValue({fieldId: 'custrecord_conauto_sol_loc_n_localizador', value: locatorData.nlocator});
                    } else {
                        currentRecord.setValue({fieldId: 'custrecord_conauto_sol_loc_n_localizador', value: 'Sin N de Localizador'});
                    }
                    if(locatorData.nserie != ''){
                        currentRecord.setValue({fieldId: 'custrecord_conauto_sol_loc_n_serie', value: locatorData.nserie});
                    } else {
                        currentRecord.setValue({fieldId: 'custrecord_conauto_sol_loc_n_serie', value: 'Sin N de Serie'});
                    }
                }
            }
            if (fieldName == 'custrecord_conauto_sol_loc_tipo_paquete') {
                var packageId = currentRecord.getValue('custrecord_conauto_sol_loc_tipo_paquete');
                if(packageId) {
                    var packageData = getPackageData(packageId)
                    if(packageData.amount != ''){
                        currentRecord.setValue({fieldId: 'custrecord_conauto_sol_loc_importe_pagar', value: packageData.amount});
                    } else {
                        currentRecord.setValue({fieldId: 'custrecord_conauto_sol_loc_importe_pagar', value: 0.00});
                    }
                }
            }
        } catch (e) {
            log.error('fieldChanged error', e);
        }
    }

    function requestEmail(scriptContext) { 
        console.log("scriptContext",scriptContext)
        var params=({ id:scriptContext })
        var suiteletURL = url.resolveScript({
            scriptId: "customscript_conauto_sl_sol_loc",
            deploymentId: "customdeploy_conauto_sl_sol_loc",
        }); 
        message = showMessageStatus();
        https.post.promise({
            url:suiteletURL,
            body:params
        }).then(function(response){
            message.hide();
            var responseObj = JSON.parse(response.body);
            if(responseObj.code == 200) {
                alertPromise('Operacion exitosa', 'Se ha notificado por correo electrónico a todos los involucrados.');
            } else if(responseObj.code == 301) {
                alertPromise('Operacion fallida', responseObj.msg);
            } else {
                alertPromise('Operacion fallida', 'Algo ha ocurrido en el proceso de notificación, comunicate con tu administrador.');
            }
        }).catch(function onRejected(reason) {
            message.hide();
            dialogAPI.alert({
                title: 'Error',
                message: reason
            });  
        })
    }

    function getLocatorData(folioId, customerId) {
		var locatorData = [];
		console.log(folioId)
        console.log(customerId)

		var locatorSearch = search.create({
			type: "customrecord_conauto_localizadores",
			filters:
			[
				["custrecord_localizador_folio","anyof",folioId], 
                "AND", 
                ["custrecord_localizador_nombre","anyof",customerId], 
                "AND", 
                ["isinactive","is","F"]
			],
			columns:
            [
                search.createColumn({
                    name: "id",
                    sort: search.Sort.ASC,
                    label: "ID"
                }),
                search.createColumn({name: "custrecord_localizador_localizador", label: "N DE LOCALIZADOR"}),
                search.createColumn({name: "custrecord_localizador_nombre", label: "NOMBRE"}),
                search.createColumn({name: "custrecord_localizador_serie", label: "No SERIE"}),
                search.createColumn({name: "custrecord_localizador_folio", label: "FOLIO"})
            ]
		});
        var locatorSearchCount = locatorSearch.runPaged().count;
        if(locatorSearchCount > 0){
            locatorSearch.run().each(function(result){
                // .run().each has a limit of 4,000 results
                locatorData.push({
                    nserie: result.getValue({name: 'custrecord_localizador_serie'}) || '',
                    nlocator: result.getValue({name: 'custrecord_localizador_localizador'}) || ''
                })
            });
        } else {
            locatorData.push({
                nserie: '',
                nlocator: ''
            })
        }
        console.log("locatorData", locatorData);

        return locatorData[0];
    }

    function getFolioData(folioId) {
		var folioData = [];
		console.log(folioId)

		var folioSearch = search.create({
			type: "customrecord_cseg_folio_conauto",
			filters:
			[
				["custrecord_localizador_folio","anyof",folioId], 
                "AND", 
                ["custrecord_localizador_nombre","anyof",customerId], 
                "AND", 
                ["isinactive","is","F"]
			],
			columns:
            [
                search.createColumn({
                    name: "id",
                    sort: search.Sort.ASC,
                    label: "ID"
                }),
                search.createColumn({name: "custrecord_localizador_localizador", label: "N DE LOCALIZADOR"}),
                search.createColumn({name: "custrecord_localizador_nombre", label: "NOMBRE"}),
                search.createColumn({name: "custrecord_localizador_serie", label: "No SERIE"}),
                search.createColumn({name: "custrecord_localizador_folio", label: "FOLIO"})
            ]
		});
        var locatorSearchCount = locatorSearch.runPaged().count;
        if(locatorSearchCount > 0){
            locatorSearch.run().each(function(result){
                // .run().each has a limit of 4,000 results
                locatorData.push({
                    nserie: result.getValue({name: 'custrecord_localizador_serie'}) || '',
                    nlocator: result.getValue({name: 'custrecord_localizador_localizador'}) || ''
                })
            });
        } else {
            locatorData.push({
                nserie: '',
                nlocator: ''
            })
        }
        console.log("locatorData", locatorData);

        return locatorData[0];
    }

    function getPackageData(packageId) {
		var packageData = [];
		console.log(packageId)

		var packageSearch = search.create({
			type: "customrecord_conauto_paquete_localizador",
			filters:
            [
                ["id","equalto",packageId]
            ],
            columns:
            [
                search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC,
                    label: "Nombre"
                }),
                search.createColumn({name: "id", label: "ID"}),
                search.createColumn({name: "custrecord_conauto_paquete_costo", label: "Costo"})
            ]
		});
        var packageSearchCount = packageSearch.runPaged().count;
        if(packageSearchCount > 0){
            packageSearch.run().each(function(result){
                // .run().each has a limit of 4,000 results
                packageData.push({
                    amount: result.getValue({name: 'custrecord_conauto_paquete_costo'}) || 0.00,
                })
            });
        } 
        console.log("packageData", packageData);

        return packageData[0];
    }
            
    return {
        fieldChanged: fieldChanged,
        requestEmail: requestEmail
    };
        
});