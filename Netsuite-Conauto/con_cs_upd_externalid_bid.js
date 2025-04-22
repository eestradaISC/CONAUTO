/**
 * @author Erick Estrada eestradaa@conauto.com
 * @name con_cs_upd_externalid_bid.js
 * @description Cliente para añadir el BID a externalid de manera funcional
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([
    "N/log",
    "N/ui/dialog",
    "N/search",
    "N/record"
], (log, dialog, search, record) => {
    const handler = {};

    /**
     * Función que es ejecutada después de que la página se carga por completo o cuando el formulario es reseteado
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @param {string} context.fieldId - Id del campo
     * @param {string} context.line - Número de línea, será indefinido si no es una sublista o un campo de matriz
     * @param {string} context.column - Número de columna, será indefinido si no es un campo de matriz
     * @since 2015.2
     */
    handler.pageInit = (context) => {
        try {
            //TODO: Add code
            let currentRecord = context.currentRecord;
            let externalid = currentRecord.getValue({ fieldId: "externalid" });
            if (externalid) {
                currentRecord.setValue({ fieldId: "custentity_con_bid_vendor", value: externalid });
            }
        } catch (error) {
            console.log(error);
            log.error("Error en pageInit", error);
        }
    }

    /**
     * Función que se ejecuta para validar la información del registro y proceder a guardar el mismo
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @since 2015.2
     */
    handler.saveRecord = (context) => {
        try {
            //TODO: Add code
            let currentRecord = context.currentRecord;
            let bid = currentRecord.getValue({
                fieldId: "custentity_con_bid_vendor"
            });
            if (currentRecord.id && bid) {
                record.submitFields.promise({
                    type: record.Type.VENDOR,
                    id: currentRecord.id,
                    values: {
                        "externalid": bid
                    }
                });
            }
            return true;
        } catch (error) {
            log.error("Error en saveRecord", error);
        }
    }

    /**
     * Función que se ejecuta para validar el campo de una sublista
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @param {string} context.fieldId - Id del campo
     * @param {string} context.line - Número de línea, será indefinido si no es una sublista o un campo de matriz
     * @param {string} context.column - Número de columna, será indefinido si no es un campo de matriz
     * @since 2015.2
     */
    handler.validateField = (context) => {
        try {
            //TODO: Add code
            return true;
        } catch (error) {
            log.error("Error en validateField", error)
        }
    }

    /**
     * Función que se ejecuta al cambiar un campo.
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @param {string} context.fieldId - Id del campo
     * @param {string} context.line - Número de línea, será indefinido si no es una sublista o un campo de matriz
     * @param {string} context.column - Número de columna, será indefinido si no es un campo de matriz
     * @since 2015.2
     */
    handler.fieldChanged = (context) => {
        try {
            //TODO: Add code
        } catch (error) {
            console.log(error);
            log.error("Error en fieldChanged", error);
        }
    };

    /**
     * Función que se ejecuta cuando un campo que obtiene información de otro campo es alterado.
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @param {string} context.fieldId - Id del campo
     * @since 2015.2
     */
    handler.postSourcing = (context) => {
        try {
            //TODO: Add code
        } catch (error) {
            log.error("Error en postSourcing", error);
        }
    }

    /**
     * Función que se ejecuta cuando un campo que obtiene información de otro campo es alterado.
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @since 2015.2
     */
    handler.lineInit = (context) => {
        try {
            //TODO: Add code
        } catch (error) {
            log.error("Error en lineInit", error);
        }
    }

    /**
     * Función que se ejecuta cuando un campo que obtiene información de otro campo es alterado.
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @param {Number} context.lineCount - Id del campo
     * @since 2015.2
     */
    handler.validateDelete = (context) => {
        try {
            //TODO: Add code
            return true;
        } catch (error) {
            log.error("Error en validateDelete", error);
        }
        return true;
    }

    /**
     * Función que se ejecuta cuando un campo que obtiene información de otro campo es alterado.
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @since 2015.2
     */
    handler.validateInsert = (context) => {
        try {
            //TODO: Add code
            return true;
        } catch (error) {
            log.error("Error en validateInsert", error);
        }
        return true;
    }

    /**
     * Función que se ejecuta cuando un campo que obtiene información de otro campo es alterado.
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @since 2015.2
     */
    handler.validateLine = (context) => {
        try {
            //TODO: Add code
            return true;
        } catch (error) {
            log.error("Error en validateLine", error);
        }
        return true;
    }

    /**
     * Función que se ejecuta cuando un campo que obtiene información de otro campo es alterado.
     * @param {Object} context
     * @param {Record} context.currentRecord - Registro actual
     * @param {string} context.sublistId - Id de la sublista
     * @since 2015.2
     */
    handler.sublistChanged = (context) => {
        try {
            //TODO: Add code
        } catch (error) {
            log.error("Error en sublistChanged", error);
        }
        return true;
    }

    return handler;
});