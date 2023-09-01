/**
* @author Ashanty Uh Canul 
* @description Script para el borrado de las aprovisiones
* @NApiVersion 2.x
* @NScriptType ScheduledScript
*/
define(['N/search', 'N/record',"N/runtime"], function (search, record, runtime) {

    function execute(conext) {
        var customrecord_conauto_sol_localizadoresSearchObj = search.create({
            type: "customrecord_conauto_sol_localizadores",
            filters:
            [
               ["externalidstring","isempty",""], 
               "AND", 
               ["created","within","today"]
            ],
            columns:
            [
               search.createColumn({
                  name: "id",
                  sort: search.Sort.ASC,
                  label: "ID"
               }),
               search.createColumn({name: "internalid", label: "ID interno"}),
               search.createColumn({name: "scriptid", label: "ID de script"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_proveedor", label: "Proveedor"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_prov_correo", label: "Correo Proveedor"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_tipo_pago", label: "Tipo de Pago"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_estado", label: "Estado"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_folio", label: "Folio"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_unidad", label: "Unidad/Catalogo"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_unidad_desc", label: "Descripción Unidad"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_unidad_anteri", label: "Unidad Anterior"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_responsable", label: "Responsable"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_aprobador", label: "Aprobador Órden de Compra"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_ordencompra", label: "Orden de Compra"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_cliente", label: "Cliente"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_cliente_tel", label: "Teléfono Cliente"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_cliente_corre", label: "Correo Cliente"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_cliente_rfc", label: "RFC"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_cliente_direc", label: "Dirección Cliente"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_cliente_fpago", label: "Forma de Pago"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_cliente_usocf", label: "Uso de CFDI"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_bid", label: "BID"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_distribuidor", label: "Distribuidor Texto"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_dist_tel", label: "Teléfono Distribuidor"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_dist_correo", label: "Correo Distribuidor"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_dist_direc", label: "Dirección Distribuidor"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_tipo_paquete", label: "Tipo de Paquete"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_meses", label: "Mes"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_importe_pagar", label: "Importe/Costo"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_imp_fac_con", label: "Importe Facturación Conauto"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_imp_fac_clien", label: "Importe Facturación Cliente"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_es_facturable", label: "Requiere Factura"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_fecha_inst", label: "Fecha de Instalación"}),
               search.createColumn({name: "custrecord_conauto_sol_loc_fecha_desinst", label: "Fecha de Desinstalación"})
            ]
         });
        var searchResultCount = customrecord_conauto_sol_localizadoresSearchObj.runPaged().count;
        log.debug("TOTAL RECORDS ENCONTRADOS",searchResultCount);
        if (searchResultCount > 0) {
            customrecord_conauto_sol_localizadoresSearchObj.run().each(function (result) {
                try {
                    var id = result.getValue({
                        "name": "internalid"
                    });
                    var recordToDelete = record.delete({
                        type: 'customrecord_conauto_sol_localizadores',
                        id: id,
                    });
                    log.debug("Record con id "+recordToDelete+" eliminado : ", "");                
                } catch (error) {
                    log.error("Fallo de eliminación con id "+recordToDelete+" : ", error);
                    log.error(error.stack);
                }
                return true;
            });
        } else {
            log.error({ title: "ERROR", details: "NO SE ENCONTRARON PAGOS"})
        }
    }

    return {
        execute: execute
    }
});
