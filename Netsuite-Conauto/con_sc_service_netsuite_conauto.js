/**
* @author Ashanty Uh Canul 
* @Modificacion <>
* @Name con_sc_service_netsuite_conauto.js
* @description Servicio de proceso entre Progress y Netsuite
* @file <URL PENDIENTE>
* @NApiVersion 2.1
* @NScriptType ScheduledScript
* @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
*/
define([
        'N/record',
        'N/file',
        'N/runtime',
        '/SuiteScripts/Conauto_Preferences.js',
        'IMR/IMRSearch',
        'N/error',
        'N/format'
],
        function (
                record,
                file,
                runtime,
                conautoPreferences,
                search,
                error,
                format) {
                let exports = {};
                /**
               * <code>execute</code> event handler
               *
               * @gov XXX
               *
               * @param context
               *        {Object}
               * @param context.type
               *        {InvocationTypes} Enumeration that holds the string values for
               *            scheduled script execution contexts
               *
               * @return {void}
               *
               * @static
               * @function execute
               */
                function execute(context) {
                        let scriptObj = runtime.getCurrentScript();
                        let logId = scriptObj.getParameter({
                                name: 'custscript_log_service_id'
                        });
                        let resultados = {
                                recordType: '',
                                transactions: [],
                                records: [],
                                solPagos: [],
                                folios: [],
                                errors: []
                        };
                        try {
                                let request = getRequestLog(logId);

                                let operations = {
                                        'PrimerasCuotas': primerasCuotas,
                                        'SolicitudPago': solicitudPago,
                                        'ActualizaContrato': actualizaContrato,
                                        'InteresesMoratorios': interesesMoratorios,
                                        'ReservaPasivo': reservaPasivo,
                                        'Bajas': bajaFolio,
                                        'ModificacionBajas': modificacionBajas,
                                        'ComplementoBajas': complementoBajas,
                                        'AplicacionCobranza': aplicacionCobranza,
                                }
                                let callback = operations[request.tipo];
                                log.debug('callback', callback);
                                if (callback) {
                                        resultados = callback(request, logId) || [];
                                        record.submitFields({
                                                type: 'customrecord_log_service_conauto',
                                                id: logId,
                                                values: {
                                                        custrecord_log_serv_processed: true,
                                                        custrecord_log_serv_recordtype: resultados.recordType,
                                                        custrecord_log_serv_transactions: resultados.transactions.join(','),
                                                        custrecord_log_serv_solpagos: resultados.solPagos.join(','),
                                                        custrecord_log_serv_record_ids: resultados.records.join(','),
                                                        custrecord_log_serv_folio: resultados.folios.join(','),
                                                        custrecord_log_serv_error: (resultados.errors || []).join('\n')
                                                }
                                        })
                                } else {
                                        throw error.create({
                                                name: 'NOT_SUPPORTED_OPERATION',
                                                message: 'OPERACIÓN INVÁLIDA: ' + request.tipo
                                        });
                                }
                        } catch (e) {
                                if (logId) {
                                        log.error({
                                                title: 'ERROR',
                                                details: 'Log id: ' + logId + ' ERROR: ' + e.toString()
                                        });
                                        record.submitFields({
                                                type: 'customrecord_log_service_conauto',
                                                id: logId,
                                                values: {
                                                        custrecord_log_serv_error: e.message.toString()
                                                }
                                        })
                                }
                        }
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
                */
                function primerasCuotas(data, logId) {
                        let recordType = 'transaction';
                        let transactions = [];
                        let payments = data.pagos || [];
                        let folios = [];

                        if (payments.length == 0) {
                                throw error.create({
                                        name: 'EMPTY_PAYMENT_LIST_FIRSTPAYMENT',
                                        message: 'LA LISTA DE PAGOS NO PUEDE ESTAR VACÍA: NO SE ENCONTRARON PAGOS A REGISTRAR EN LA PETICIÓN'
                                })
                        }

                        let preferences = conautoPreferences.get();
                        let subsidiary = preferences.getPreference({ key: 'SUBCONAUTO' });

                        if (!subsidiary) {
                                throw error.create({
                                        name: 'EMPTY_CONFG_SUBSIDIARY',
                                        message: 'NO SE CONFIGURÓ LA SUBSIDIARIA DE OPERACIÓN. VAYA A CONFIGURADOR CONAUTO Y VÁLIDE LA INFORMACIÓN'
                                })
                        }

                        let cuentaCobranzaNoIden = preferences.getPreference({
                                key: 'CCNI'
                        });

                        if (!cuentaCobranzaNoIden) {
                                throw error.create({
                                        name: 'EMPTY_CONFG_CCNI',
                                        message: 'NO SE CONFIGURÓ LA CUENTA DE COBRANZA NO IDENTIFICADA. VAYA A CONFIGURADOR CONAUTO Y VÁLIDE LA INFORMACIÓN'
                                })
                        }

                        let mandatoryFields = ['folio', 'referencia', 'referenciaCompleta', 'fechaCobranza', 'fechaPago', 'monto', 'formaPago', 'numPago'];
                        let errors = [];

                        for (let i = 0; i < payments.length; i++) {
                                let payment = payments[i];
                                if (payment.folio) {
                                        folios.push(payment.folio)
                                }
                                checkMandatoryFields(payment, mandatoryFields, i + 1, logId, errors);
                        }

                        let primerosPagos = [];
                        search.searchAllRecords({
                                type: search.main().Type.TRANSACTION,
                                filters: [
                                        search.createFilter({
                                                name: 'type',
                                                operator: search.main().Operator.ANYOF,
                                                values: 'Journal'
                                        }),
                                        search.createFilter({
                                                name: 'externalid',
                                                join: 'line.cseg_folio_conauto',
                                                operator: search.main().Operator.ANYOF,
                                                values: folios
                                        })
                                ],
                                columns: [
                                        search.createColumn({ name: 'line.cseg_folio_conauto', summary: search.main().Summary.GROUP }),
                                        search.createColumn({ name: 'externalid', join: 'line.cseg_folio_conauto', summary: search.main().Summary.GROUP })
                                ],
                                data: primerosPagos,
                                callback: function (result, primerosPagos) {
                                        primerosPagos.push(result.getValue({ name: 'externalid', join: 'line.cseg_folio_conauto', summary: search.main().Summary.GROUP }));
                                }
                        });

                        if (errors.length == 0) {
                                for (let i = 0; i < payments.length; i++) {
                                        let payment = payments[i];
                                        if (payment.referencia) {
                                                let account = preferences.getPreference({
                                                        key: 'CB1P',
                                                        reference: (payment.referencia || '').substring(0, 2)
                                                });
                                                if (!account) {
                                                        errors.push('REFERENCIA LÍNEA ' + i + ': \'' + payment.referencia + '\' NO VÁLIDA, SIN CUENTA');
                                                } else {
                                                        payment.account = account;
                                                }
                                        }
                                }
                        }

                        let foliosId = [];
                        if (errors.length == 0) {
                                let foliosText = [];
                                for (let i = 0; i < payments.length; i++) {
                                        let folioText = payments[i].folio;
                                        if (folioText && foliosText.indexOf(folioText) == -1) {
                                                foliosText.push(folioText);
                                        }
                                }
                                let dataFolios = {};
                                search.searchAllRecords({
                                        type: 'customrecord_cseg_folio_conauto',
                                        columns: [
                                                search.createColumn({ name: 'internalid' }),
                                                search.createColumn({ name: 'externalid' })
                                        ],
                                        filters: [
                                                search.createFilter({
                                                        name: 'externalid', //probar con name
                                                        operator: search.main().Operator.ANYOF,
                                                        values: foliosText
                                                })
                                        ],
                                        data: dataFolios,
                                        callback: function (result, dataFolios) {
                                                let id = result.getValue({ name: 'internalid' });
                                                let folio = result.getValue({ name: 'externalid' });
                                                dataFolios[folio] = id;
                                                foliosId.push(id);
                                        }
                                });
                                let hashDate = {};
                                for (let i = 0; i < payments.length; i++) {
                                        hashDate[payments[i].fechaCobranza] = hashDate[payments[i].fechaCobranza] || [];
                                        hashDate[payments[i].fechaCobranza].push(payments[i]);
                                }
                                for (let date in hashDate) {
                                        let journal = record.create({
                                                type: record.Type.JOURNAL_ENTRY,
                                                isDynamic: true
                                        });
                                        journal.setValue({
                                                fieldId: 'subsidiary',
                                                value: subsidiary
                                        });
                                        journal.setValue({
                                                fieldId: 'custbody_imr_tippolcon',
                                                value: 2
                                        });
                                        journal.setValue({
                                                fieldId: 'currency',
                                                value: 1
                                        });
                                        journal.setValue({
                                                fieldId: 'memo',
                                                value: 'Primer pago'
                                        });
                                        journal.setValue({
                                                fieldId: 'custbody_tipo_transaccion_conauto',
                                                value: 1
                                        });
                                        journal.setValue({
                                                fieldId: 'trandate',
                                                value: stringToDateConauto(date)
                                        });
                                        let amountTotal = 0;
                                        let countLinesJournal = 0;
                                        let listPayments = hashDate[date];
                                        for (let i = 0; i < listPayments.length; i++) {
                                                let payment = listPayments[i];
                                                let folioText = payment.folio;
                                                let folioId = dataFolios[folioText];
                                                if (!folioId) {
                                                        let folioObj = record.create({
                                                                type: 'customrecord_cseg_folio_conauto',
                                                                isDynamic: true
                                                        });
                                                        folioObj.setValue({
                                                                fieldId: 'name',
                                                                value: folioText
                                                        });
                                                        folioObj.setValue({
                                                                fieldId: 'externalid',
                                                                value: folioText
                                                        });
                                                        folioId = folioObj.save({
                                                                ignoreMandatoryFields: true
                                                        });
                                                        dataFolios[folioText] = folioId;
                                                }
                                                if (primerosPagos.indexOf(payment.folio) != -1) {
                                                        //continue;
                                                }
                                                let amount = parseFloatRound(payment.monto);
                                                amountTotal += amount;
                                                journal.selectNewLine({
                                                        sublistId: 'line'
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'account',
                                                        value: payment.account
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'debit',
                                                        value: amount
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'memo',
                                                        value: 'Cobranza PRIMERAS CUOTAS de la referencia ' + payment.referencia
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'custcol_folio_texto_conauto',
                                                        value: payment.folio
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'custcol_referencia_conauto',
                                                        value: payment.referencia
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'custcol_metodo_pago_conauto',
                                                        value: getFormaPago(payment.formaPago)
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'custcol_imr_fecha_pago',
                                                        value: stringToDateConauto(payment.fechaPago)
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'cseg_folio_conauto',
                                                        value: folioId
                                                });
                                                journal.commitLine({
                                                        sublistId: 'line'
                                                });
                                                //
                                                journal.selectNewLine({
                                                        sublistId: 'line'
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'account',
                                                        value: cuentaCobranzaNoIden
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'memo',
                                                        value: 'Cobranza PRIMERAS CUOTAS de la referencia ' + payment.referencia
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'credit',
                                                        value: amount
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'custcol_folio_texto_conauto',
                                                        value: payment.folio
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'custcol_referencia_conauto',
                                                        value: payment.referencia
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'custcol_metodo_pago_conauto',
                                                        value: payment.formaPago
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'custcol_imr_fecha_pago',
                                                        value: stringToDateConauto(payment.fechaPago)
                                                });
                                                journal.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'cseg_folio_conauto',
                                                        value: folioId
                                                });
                                                journal.commitLine({
                                                        sublistId: 'line'
                                                });
                                                countLinesJournal++;
                                                if (countLinesJournal == 2500) {
                                                        countLinesJournal = 0;
                                                        transactions.push(journal.save({
                                                                ignoreMandatoryFields: true
                                                        }));
                                                        journal = record.create({
                                                                type: record.Type.JOURNAL_ENTRY,
                                                                isDynamic: true
                                                        });
                                                        journal.setValue({
                                                                fieldId: 'subsidiary',
                                                                value: subsidiary
                                                        });
                                                        journal.setValue({
                                                                fieldId: 'custbody_imr_tippolcon',
                                                                value: 2
                                                        });
                                                        journal.setValue({
                                                                fieldId: 'currency',
                                                                value: 1
                                                        });
                                                        journal.setValue({
                                                                fieldId: 'memo',
                                                                value: 'Primer pago'
                                                        });
                                                        journal.setValue({
                                                                fieldId: 'custbody_tipo_transaccion_conauto',
                                                                value: 1
                                                        });
                                                        journal.setValue({
                                                                fieldId: 'trandate',
                                                                value: stringToDateConauto(date)
                                                        });
                                                }
                                        }
                                        if (countLinesJournal > 0) {
                                                let journalId = journal.save({
                                                        ignoreMandatoryFields: true
                                                });
                                                transactions.push(journalId);
                                        }
                                }
                        } else {
                                throw error.create({
                                        name: 'DATA_ERROR_FIRSTPAYMENT',
                                        message: errors.join('\n')
                                })
                        }

                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: transactions,
                                solPagos: [],
                                folios: foliosId
                        };
                }

                /***
                *
                * @param data
                * @param {String} data.tipo  tipo de request
                * @param {Object[]} data.detalles Lista de solicitudes de pagos
                * @param {String} data.detalles[].tipoMovimiento Id del tipo de movimiento
                * @param {Number} data.detalles[].monto monto del pago
                * @param {String} data.detalles[].folio folio
                * @param {String} data.detalles[].cuentaBancaria Identidicador de la cuenta
                * @param {Object} data.detalles[].beneficiario Objecto con el beneficiario
                * @param {Object} data.detalles[].beneficiario.rfc rfc del beneficiario
                * @param {Object} data.detalles[].beneficiario.nombre nombre del beneficiario
                * @param response
                * @param {Number} response.code
                * @param {Array} response.Info
                */
                function solicitudPago(data, logId) {
                        let recordType = 'customrecord_imr_solicitud_pago';
                        let transactions = [];
                        let foliosId = [];
                        for (let i = 0; i < data.detalles.length; i++) {
                                let detalle = data.detalles[i];
                                let recordObj = record.create({
                                        type: 'customrecord_imr_solicitud_pago'
                                });
                                let fields = {
                                        custrecord_imr_solpa_tipo_mov: detalle.tipoMovimiento,
                                        custrecord_imr_solpa_importe: detalle.monto,
                                        custrecord_imr_solpa_nom_ben: detalle.beneficiario.nombre,
                                        custrecord_imr_solpa_rfc_ben: detalle.beneficiario.rfc,
                                        custrecord_imr_solpa_folio_texto: detalle.folio,
                                        custrecord_imr_solpa_banco_texto: detalle.banco || '',
                                        custrecord_imr_solpa_ref_bancaria: detalle.cuentaBBVA || '',
                                        custrecord_imr_solpa_rembolso: detalle.reembolso,
                                        custrecord_imr_solpa_saldo_favor: detalle.saldoFavor,
                                        custrecord_imr_referenciacon: detalle.referencia || '', //L.R.M.R. 02/08/2021 Se mapea el campo ya que no se tomaba.
                                        //Layout
                                        custrecord_imr_bbva_nc_tipo_lay: detalle.tipoPago || '',
                                        custrecord_imr_bbva_nc_tip_cta: detalle.tipoCuenta || '',
                                        custrecord_imr_bbva_nc_disponi: detalle.disponibilidad || '',
                                        custrecord_imr_ctaclabe_con: detalle.cuentaClabe || '',
                                        custrecord_imr_solpa_beneficiaro: detalle.beneficiario.nombre || '',
                                        custrecord_imr_ref_numerica: detalle.referenciaNumerica || '',
                                        custrecord_imr_conv_cie_con: detalle.convenioCIE || '',
                                        custrecord_imr_concepto_con: detalle.concepto || '',
                                        custrecord_imr_ref_cie: detalle.referenciaCIE || ''
                                }
                                for (let fieldsKey in fields) {
                                        let value = fields[fieldsKey];
                                        recordObj.setValue({
                                                fieldId: fieldsKey,
                                                value: value
                                        })
                                }
                                transactions.push(recordObj.save({
                                        ignoreMandatoryFields: true
                                }));
                                foliosId.push(recordFind('customrecord_cseg_folio_conauto', 'anyof', 'externalid', detalle.folio));
                        }
                        return {
                                recordType: recordType,
                                transactions: [],
                                records: transactions,
                                solPagos: transactions,
                                folios: foliosId
                        };
                }

                /**
                * @param {Object} data
                * @param {String} data.tipo 
                * @param {String} data.idNotificacion 
                * @param {String} data.tipo  tipo de request
                * @param {String} data.folio  folio a actualizar
                * @param {String} data.integrante  numero de integrante
                * @param {String} data.bid  Id de progress del proveedor
                * @param {String} data.distribuidora  nombre de la distribuidora del contrato
                * @param {String} data.catalogoAuto  nombre del catalogo del auto
                * @param {String} data.descripcionAuto  descripcion del catalogo del auto
                * @param {String} data.precio  precio del auto
                * @param {String} data.lista  numero de lista del auto
                * @param {String} data.fechaContrato  fecha del contrato
                * @param {String} data.uso  descripcion del uso
                * @param {String} data.rfcVendedor  rfc del Vendedor
                * @param {String} data.nombreVendedor  nombre del vendedor
                * @param {String} data.vendor vendedor
                * @param {String} data.fechaRecepcion  fecha de la recepcion
                * @param {String} data.beneficiario  beneficiario
                * @param {String} data.tipoPago  Tipo de pago
                * @param {String} data.pagoCon
                * @param {String} data.pagoBoleta pago de la boleta
                * @param {String} data.pda
                * @param {String} data.fechaPago fecha del pago
                * @param {String} data.estado  id del estado del folio
                * @param {String} data.subestado  id del subestado del folio
                * @param {String} data.fechaCesion  fecha de la cesion
                * @param {String} data.mesCesion  mes de la cesion
                * @param {Object} data.importe  
                * @param {Object} data.banco 
                * @param {Object} data.totalPagado 
                * @param {Object} data.cliente  datos del cliente
                * @param {boolean} data.cliente.esPersona  indica si es persona o empresa
                * @param {String} data.cliente.nombre  nombre del cliente
                * @param {String} data.cliente.apellidoPaterno apellido paterno del cliente en caso de ser persona
                * @param {String} data.cliente.apellidoMaterno apellido materno del cliente en caso de ser persona
                * @param {String} data.cliente.rfc rfc del cliente
                * @param {String} data.cliente.sexo sexo del cliente
                * @param {String} data.cliente.fechaNacimiento fecha de nacimiento
                * @param {String} data.cliente.curp curp del cliente
                * @param {String} data.cliente.estadoCivil estado civil del cliente
                * @param {String} data.cliente.telefono
                * @param {String} data.cliente.telefonoCasa
                * @param {String} data.cliente.celular
                * @param {String} data.cliente.correo
                * @param {String} data.cliente.rf-clave
                * @param {String} data.cliente.razon
                * @param {Object} data.cliente.direccion datos de la dirección
                * @param {Object} data.cliente.direccion.calle
                * @param {Object} data.cliente.direccion.numero
                * @param {Object} data.cliente.direccion.colonia
                * @param {Object} data.cliente.direccion.ciudad
                * @param {Object} data.cliente.direccion.estado
                * @param {Object} data.cliente.direccion.cp
                * @param {Object} data.cliente.direccion.municipio
                * @param {Object} data.grupo datos del grupo
                * @param {Object} data.grupo.id identificador del grupo llave unicia
                * @param {Object} data.grupo.nombre nombre para mostrar
                * @param {Object} data.grupo.tipo 
                * @param {Object} data.grupo.clavePlan
                * @param {Object} data.grupo.descripcionPlan
                * @param {Object} data.grupo.factorIntegrante
                * @param {Object} data.grupo.factorAdjudicado
                * @param {Object} data.grupo.plazo
                * @param {Object} data.grupo.inicioVigencia
                * @param {Object} data.grupo.finVigencia
                * @param {Object} data.grupo.clavePromocion
                * @param {Object} data.grupo.descripcionPromocion
                * @param {Object} response
                * @param {Number} response.code
                * @param {Array}  response.info
                */
                function actualizaContrato(data, response) {
                        let recordType = 'customrecord_cseg_folio_conauto';
                        let folioId = recordFind(recordType, 'anyof', 'externalid', data.folio);
                        if (!folioId) {
                                folioId = recordFind('customrecord_cseg_folio_conauto', 'is', 'name', data.folio);
                        }
                        if (folioId) {
                                let recordObj = record.load({
                                        type: recordType,
                                        id: folioId,
                                        isDynamic: true
                                });
                                setOpcionalData(recordObj, data.estado, 'custrecord_folio_estado');
                                setOpcionalData(recordObj, data.subestado, 'custrecord_folio_subestatus');
                                if (data.folioSustitucion) {
                                        data.folioSustitucion = recordFind(recordType, 'anyof', 'externalid', data.folioSustitucion);
                                }
                                let mapsFieldsFolio = [
                                        {
                                                'field': 'folioSustitucion',
                                                'fieldRecord': 'custrecord_folio_sustitucion',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'bid',
                                                'fieldRecord': 'custrecord_imr_bid_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'distribuidora',
                                                'fieldRecord': 'custrecord_imr_distribuidora_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'catalogoAuto',
                                                'fieldRecord': 'custrecord_imr_catalogoauto_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'descripcionAuto',
                                                'fieldRecord': 'custrecord_imr_descripauto_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'precio',
                                                'fieldRecord': 'custrecord_imr_precio_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'lista',
                                                'fieldRecord': 'custrecord_imr_lista_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'fechaContrato',
                                                'fieldRecord': 'custrecord_imr_fechacontrato_conauto',
                                                'type': 'date'
                                        },
                                        {
                                                'field': 'uso',
                                                'fieldRecord': 'custrecordimr_uso_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'rfcVendedor',
                                                'fieldRecord': 'custrecord_imr_rfcvendedor_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'vendedor',
                                                'fieldRecord': 'custrecord_imr_nombrevende_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'fechaRecepcion',
                                                'fieldRecord': 'custrecord_imr_fecharecep_conauto',
                                                'type': 'date'
                                        },
                                        {
                                                'field': 'beneficiario',
                                                'fieldRecord': 'custrecord_imr_beneficiario_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'tipoPago',
                                                'fieldRecord': 'custrecord_imr_tipopago_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'pagoCon',
                                                'fieldRecord': 'custrecord_imr_pagocon_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'pagoBoleta',
                                                'fieldRecord': 'custrecord_imr_pagoconboleta_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'pda',
                                                'fieldRecord': 'custrecord_imr_pda_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'fechaPago',
                                                'fieldRecord': 'custrecord_imr_fechapagoinicialfolio_con',
                                                'type': 'date'
                                        },
                                        {
                                                'field': 'importe',
                                                'fieldRecord': 'custrecord_imr_importe_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'banco',
                                                'fieldRecord': 'custrecord_imr_banco_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'totalPagado',
                                                'fieldRecord': 'custrecord_imr_totalpagado_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'integrante',
                                                'fieldRecord': 'custrecord_imr_integrante_conauto',
                                                'type': 'text'
                                        }
                                ]
                                setDataRecord(mapsFieldsFolio, data, recordObj);
                                if (data.cliente) {
                                        let customerId = recordFind('customer', 'is', 'custentity_imr_rfc_operacion', data.cliente.rfc);
                                        let customerObj = null;
                                        let preferences = conautoPreferences.get();
                                        log.debug('customerId', customerId);
                                        if (customerId) {
                                                customerObj = record.load({
                                                        type: 'customer',
                                                        id: customerId,
                                                        isDynamic: true
                                                })
                                        } else {
                                                customerObj = record.create({
                                                        type: 'customer',
                                                        isDynamic: true
                                                });
                                                let subsidiary = preferences.getPreference({
                                                        key: 'SUBCONAUTO'
                                                });
                                                customerObj.setValue({
                                                        fieldId: 'subsidiary',
                                                        value: subsidiary
                                                });
                                        }
                                        if (data.cliente.esPersona) {
                                                customerObj.setValue({
                                                        fieldId: 'isperson',
                                                        value: 'T'
                                                });
                                                customerObj.setValue({
                                                        fieldId: 'firstname',
                                                        value: data.cliente.nombre
                                                });
                                                customerObj.setValue({
                                                        fieldId: 'lastname',
                                                        value: (data.cliente.apellidoMaterno) ? `${data.cliente.apellidoPaterno} ${data.cliente.apellidoMaterno}` : data.cliente.apellidoPaterno
                                                });
                                        } else {
                                                customerObj.setValue({
                                                        fieldId: 'isperson',
                                                        value: 'F'
                                                });
                                                customerObj.setValue({
                                                        fieldId: 'companyname',
                                                        value: data.cliente.nombre
                                                });
                                        }
                                        let mapsFieldsClient = [
                                                {
                                                        'field': 'rfc',
                                                        'fieldRecord': 'custentity_imr_rfc_operacion',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'razon',
                                                        'fieldRecord': 'custentity_razon_social',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'rf-clave',
                                                        'fieldRecord': 'custentity_imr_fe40_regimenfiscal',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'tipo',
                                                        'fieldRecord': 'custentity_imr_tipocliente',
                                                        'type': 'boolean'
                                                },
                                                {
                                                        'field': 'sexo',
                                                        'fieldRecord': 'custentity_imr_sexoconauto',
                                                        'type': 'boolean'
                                                },
                                                {
                                                        'field': 'fechaNacimiento',
                                                        'fieldRecord': 'custentity_imr_fechanacconauto',
                                                        'type': 'date'
                                                },
                                                {
                                                        'field': 'curp',
                                                        'fieldRecord': 'custentity_imr_curpconauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'estadoCivil',
                                                        'fieldRecord': 'custentity_imr_edocivilconauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'telefono',
                                                        'fieldRecord': 'phone',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'telefonoCasa',
                                                        'fieldRecord': 'altphone',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'celular',
                                                        'fieldRecord': 'mobilephone',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'correo',
                                                        'fieldRecord': 'email',
                                                        'type': 'text'
                                                }
                                        ]
                                        setDataRecord(mapsFieldsClient, data.cliente, customerObj);
                                        customerObj.setValue({
                                                fieldId: 'vatregnumber',
                                                value: data.cliente.rfc
                                        }); //L.R.M.R. 29/09/2021
                                        if (data.cliente.direccion) {
                                                let countLine = customerObj.getLineCount({
                                                        sublistId: 'addressbook'
                                                });
                                                log.error({
                                                        title: 'countLine',
                                                        details: countLine
                                                });
                                                if (countLine == 0) {
                                                        customerObj.selectNewLine({
                                                                sublistId: 'addressbook'
                                                        });
                                                } else {
                                                        customerObj.selectLine({
                                                                sublistId: 'addressbook',
                                                                line: 1
                                                        })
                                                }
                                                customerObj.setCurrentSublistValue({
                                                        sublistId: 'addressbook',
                                                        fieldId: 'defaultshipping',
                                                        value: true
                                                });
                                                customerObj.setCurrentSublistValue({
                                                        sublistId: 'addressbook',
                                                        fieldId: 'defaultbilling',
                                                        value: true
                                                });
                                                let addressObj = customerObj.getCurrentSublistSubrecord({
                                                        sublistId: 'addressbook',
                                                        fieldId: 'addressbookaddress'
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'country',
                                                        value: 'MX'
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'addr1',
                                                        value: data.cliente.direccion.calle
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'addr2',
                                                        value: data.cliente.direccion.colonia
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'addr3',
                                                        value: data.cliente.direccion.municipio || ''
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'state',
                                                        value: data.cliente.direccion.estado
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'city',
                                                        value: data.cliente.direccion.ciudad
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'zip',
                                                        value: data.cliente.direccion.cp
                                                });
                                                customerObj.commitLine({
                                                        sublistId: 'addressbook'
                                                });
                                        }
                                        customerId = customerObj.save({
                                                ignoreMandatoryFields: true
                                        });
                                        recordObj.setValue({
                                                fieldId: 'custrecord_cliente_integrante',
                                                value: customerId
                                        });
                                }
                                if (data.grupo) {
                                        let grupoId = recordFind('customrecord_cseg_grupo_conauto', 'anyof', 'externalid', data.grupo.id);
                                        if (grupoId === '' || grupoId === null) {
                                                grupoId = recordFind('customrecord_cseg_grupo_conauto', 'is', 'name', data.grupo.nombre);
                                        }
                                        let grupoObj = null;
                                        log.debug('grupoId', grupoId);
                                        if (grupoId) {
                                                grupoObj = record.load({
                                                        type: 'customrecord_cseg_grupo_conauto',
                                                        id: grupoId,
                                                        isDynamic: true
                                                })
                                        } else {
                                                grupoObj = record.create({
                                                        type: 'customrecord_cseg_grupo_conauto',
                                                        isDynamic: true
                                                });
                                                grupoObj.setValue({
                                                        fieldId: 'externalid',
                                                        value: data.grupo.id
                                                });
                                        }
                                        let mapsFieldGrupo = [
                                                {
                                                        'field': 'nombre',
                                                        'fieldRecord': 'name',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'tipo',
                                                        'fieldRecord': 'custrecord_imr_tipoplan_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'clavePlan',
                                                        'fieldRecord': 'custrecord_imr_claveplan_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'descripcionPlan',
                                                        'fieldRecord': 'custrecord_imr_descipplan_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'factorIntegrante',
                                                        'fieldRecord': 'custrecord_imr_factorint_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'factorAdjudicado',
                                                        'fieldRecord': 'custrecord_imr_factoradju_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'plazo',
                                                        'fieldRecord': 'custrecord_imr_plazo_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'incioVigencia',
                                                        'fieldRecord': 'custrecord_imr_inivig_conauto',
                                                        'type': 'date'
                                                },
                                                {
                                                        'field': 'finVigencia',
                                                        'fieldRecord': 'custrecord_imr_finvig_conauto',
                                                        'type': 'date'
                                                },
                                                {
                                                        'field': 'clavePromocion',
                                                        'fieldRecord': 'custrecord_imr_clavepromo_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'descripcionPromocion',
                                                        'fieldRecord': 'custrecord_imr_descpromo_conauto',
                                                        'type': 'text'
                                                }
                                        ];
                                        setDataRecord(mapsFieldGrupo, data.grupo, grupoObj);
                                        grupoId = grupoObj.save({
                                                ignoreMandatoryFields: true
                                        });
                                        recordObj.setValue({
                                                fieldId: 'custrecord_grupo',
                                                value: grupoId
                                        })
                                }
                                folioId = recordObj.save({
                                        ignoreMandatoryFields: true
                                });
                        }
                        return {
                                recordType: recordType,
                                transactions: [],
                                records: [folioId],
                                solPagos: [],
                                folios: [folioId]
                        };
                }


                function aplicarCartera(amortizacionId) {
                        let dataAmortizacion = search.lookupFieldsIMR({
                                id: amortizacionId,
                                type: 'customrecord_imr_amortizacionconauto_enc',
                                columns: ['custrecord_imr_amo_diario_prov_cartera', 'custrecord_imr_amo_folio_actual']
                        });
                        let diarioCartera = dataAmortizacion.custrecord_imr_amo_diario_prov_cartera.value;
                        let folio = dataAmortizacion.custrecord_imr_amo_folio_actual.value;
                        if (!diarioCartera && folio) {
                                let pagosUnidad = search.searchAllRecords({
                                        type: 'customrecord_imr_pago_unidad',
                                        filters: [
                                                search.createFilter({
                                                        name: 'custrecord_imr_pu_folio',
                                                        operator: search.main().Operator.ANYOF,
                                                        values: [folio]
                                                })
                                        ],
                                        columns: [
                                                search.createColumn({
                                                        name: 'custrecord_imr_pu_pago_amortizacion'
                                                }),
                                                search.createColumn({
                                                        name: 'custrecord_imr_pu_dif_cc_vf'
                                                }),
                                                search.createColumn({
                                                        name: 'custrecord_imr_pu_referencia'
                                                }),
                                                search.createColumn({
                                                        name: 'custrecord_imr_pu_folio'
                                                }),
                                                search.createColumn({
                                                        name: 'custrecord_imr_pu_fecha'
                                                })
                                        ]
                                });
                                let emisionPoliza = search.searchAllRecords({
                                        type: 'customrecord_imr_conauto_emision_poliza',
                                        filters: [
                                                search.createFilter({
                                                        name: 'custrecord_imr_ep_folio',
                                                        operator: search.main().Operator.ANYOF,
                                                        values: [folio]
                                                }),
                                                search.createFilter({
                                                        name: 'custrecord_imr_ep_transaccion',
                                                        operator: search.main().Operator.ANYOF,
                                                        values: ['@NONE@']
                                                })
                                        ],
                                        columns: [
                                                search.createColumn({
                                                        name: 'custrecord_imr_ep_integrante'
                                                }),
                                                search.createColumn({
                                                        name: 'custrecord_imr_ep_grupo'
                                                }),
                                                search.createColumn({
                                                        name: 'custrecord_imr_ep_folio'
                                                }),
                                                search.createColumn({
                                                        name: 'custrecord__imr_ep_cliente'
                                                }),
                                                search.createColumn({
                                                        name: 'custrecord_imr_ep_grupo'
                                                }),
                                        ]
                                });
                                //Se valida que exista pago de unidad y emision de poliza
                                if (pagosUnidad.length > 0 && emisionPoliza.length > 0) {
                                        //Generar los pagos virtuales 
                                        for (let i = 0; i < pagosUnidad.length; i++) {
                                                let pagoUnidad = pagosUnidad[i];
                                                let pagoUnidadId = pagoUnidad.id;
                                                let referencia = pagoUnidad.getValue({
                                                        name: 'custrecord_imr_pu_referencia'
                                                }) || '';
                                                let fechaPagoUnidad = pagoUnidad.getValue({
                                                        name: 'custrecord_imr_pu_fecha'
                                                }) || '';
                                                let folioText = pagoUnidad.getText({
                                                        name: 'custrecord_imr_pu_folio'
                                                }) || '';
                                                let folio = pagoUnidad.getValue({
                                                        name: 'custrecord_imr_pu_folio'
                                                }) || '';
                                                let diferencia = parseFloat(pagoUnidad.getValue({
                                                        name: 'custrecord_imr_pu_dif_cc_vf'
                                                })) || 0;
                                                if (diferencia) {
                                                        let pagoAmortizacionObj = record.create({
                                                                type: 'customrecord_imr_pagos_amortizacion'
                                                        });
                                                        pagoAmortizacionObj.setValue({
                                                                fieldId: 'custrecord_imr_pa_folio_texto',
                                                                value: folioText
                                                        });
                                                        pagoAmortizacionObj.setValue({
                                                                fieldId: 'custrecord_imr_pa_referencia',
                                                                value: referencia.substring(0, 2)
                                                        });
                                                        pagoAmortizacionObj.setValue({
                                                                fieldId: 'custrecord_imr_pa_referencia_completa',
                                                                value: referencia
                                                        });
                                                        pagoAmortizacionObj.setValue({
                                                                fieldId: 'custrecord_imr_pa_importe',
                                                                value: diferencia
                                                        });
                                                        pagoAmortizacionObj.setValue({
                                                                fieldId: 'custrecord_imr_pa_folio',
                                                                value: folio
                                                        });
                                                        if (fechaPagoUnidad) {
                                                                pagoAmortizacionObj.setValue({
                                                                        fieldId: 'custrecord_imr_pa_fecha',
                                                                        value: format.parse({
                                                                                type: format.Type.DATE,
                                                                                value: fechaPagoUnidad
                                                                        })
                                                                });
                                                                pagoAmortizacionObj.setValue({
                                                                        fieldId: 'custrecord_imr_pa_fecha_pago',
                                                                        value: format.parse({
                                                                                type: format.Type.DATE,
                                                                                value: fechaPagoUnidad
                                                                        })
                                                                });
                                                        }
                                                        pagoAmortizacionObj.setValue({
                                                                fieldId: 'custrecord_imr_pa_pago_virtual',
                                                                value: true
                                                        });
                                                        let pagoAmortizacionId = pagoAmortizacionObj.save({
                                                                ignoreMandatoryFields: true
                                                        });
                                                        record.submitFields({
                                                                type: 'customrecord_imr_pago_unidad',
                                                                id: pagoUnidadId,
                                                                values: {
                                                                        custrecord_imr_pu_pago_amortizacion: pagoAmortizacionId
                                                                }
                                                        })
                                                }
                                        }
                                        let resultAmortizacion = emisionPoliza[0];
                                        //Provisionar cartera
                                        let results = search.searchAllRecords({
                                                id: 'customsearch_imr_provision_cartera',
                                                filters: [
                                                        search.createFilter({
                                                                name: 'custrecord_imr_amo_det_parent',
                                                                operator: search.main().Operator.ANYOF,
                                                                values: [amortizacionId]
                                                        })
                                                ]
                                        });
                                        if (results.length > 0) {
                                                let result = results[0];
                                                let preferences = conautoPreferences.get();
                                                let grupo = resultAmortizacion.getText({ name: 'custrecord_imr_ep_grupo' });
                                                let integrante = resultAmortizacion.getValue({ name: 'custrecord_imr_ep_integrante' });
                                                let folio = resultAmortizacion.getValue({ name: 'custrecord_imr_ep_folio' });
                                                let folioText = resultAmortizacion.getText({ name: 'custrecord_imr_ep_folio' });
                                                let cliente = resultAmortizacion.getValue({ name: 'custrecord__imr_ep_cliente' });
                                                let grupoId = resultAmortizacion.getValue({ name: 'custrecord_imr_ep_grupo' });
                                                let memo = 'Creación de la cartera por adjudicación de la unidad del cliente ' + grupo + ' - ' + integrante;
                                                let type = '16';
                                                let journalObj = createRecordHeader(record.Type.JOURNAL_ENTRY, preferences, memo, type);
                                                let accountDebit = preferences.getPreference({
                                                        key: 'PCP',
                                                        reference: 'carteraDebito'
                                                });
                                                let accountCredit = preferences.getPreference({
                                                        key: 'PCP',
                                                        reference: 'carteraCredito'
                                                });
                                                let conceptos = ['aportacion', 'gastos', 'iva', 'seguroVida', 'seguroAuto'];
                                                let columns = result.columns;
                                                for (let i = 0; i < conceptos.length; i++) {
                                                        let concepto = conceptos[i];
                                                        let classId = preferences.getPreference({
                                                                key: 'CLSP',
                                                                reference: concepto
                                                        });
                                                        log.error({ title: 'column', details: JSON.stringify(columns[i]) });
                                                        let value = result.getValue(columns[i]);
                                                        log.error({ title: 'value', details: value });
                                                        let amount = parseFloat(result.getValue(columns[i]));
                                                        if (amount > 0) {
                                                                setDataLine(journalObj, 'line', [
                                                                        { fieldId: 'account', value: accountDebit },
                                                                        { fieldId: 'debit', value: amount },
                                                                        { fieldId: 'entity', value: cliente },
                                                                        { fieldId: 'cseg_grupo_conauto', value: grupoId },
                                                                        { fieldId: 'cseg_folio_conauto', value: folio },
                                                                        { fieldId: 'memo', value: memo },
                                                                        { fieldId: 'class', value: classId },
                                                                ]);
                                                                setDataLine(journalObj, 'line', [
                                                                        { fieldId: 'account', value: accountCredit },
                                                                        { fieldId: 'credit', value: amount },
                                                                        { fieldId: 'entity', value: cliente },
                                                                        { fieldId: 'cseg_grupo_conauto', value: grupoId },
                                                                        { fieldId: 'cseg_folio_conauto', value: folio },
                                                                        { fieldId: 'memo', value: memo },
                                                                        { fieldId: 'class', value: classId },
                                                                ]);
                                                        }

                                                }
                                                let seguroAutoAmount = parseFloat(result.getValue(columns[4]));
                                                let classSeguroAutoId = preferences.getPreference({
                                                        key: 'CLSP',
                                                        reference: 'seguroAuto'
                                                });
                                                //let journalSeguroAutoCarteraId = null; 
                                                let journalSeguroAutoProvisionId = null;
                                                if (seguroAutoAmount) {
                                                        let memoSeguroAutoCartera = 'Disminución del pasivo automotriz por aplicación de la cobranza GPO ' + grupo + ' FOL ' + folioText + ' INT ' + integrante;
                                                        let memoSeguroAutoProvision = 'Disminución del pasivo automotriz por aplicación de la cobranza GPO ' + grupo + ' FOL ' + folioText + ' INT ' + integrante;
                                                        let accountDebitSeguroAuto = preferences.getPreference({
                                                                key: 'CCP',
                                                                reference: 'seguroAutoAumento'
                                                        });
                                                        let accountCreditSeguroAuto = preferences.getPreference({
                                                                key: 'CCP',
                                                                reference: 'seguroAutoDisminucion'
                                                        });
                                                        //let journalSeguroAutoCartera = createRecordHeader(record.Type.JOURNAL_ENTRY,preferences,memoSeguroAutoCartera,type); //L.R.M.R. 24/08/2021 Solicitan que ya no se este generando este diario
                                                        let journalSeguroAutoProvision = createRecordHeader(record.Type.JOURNAL_ENTRY, preferences, memoSeguroAutoProvision, type);
                                                        /* //L.R.M.R. 24/08/2021 Solicitan que ya no se este generando este diario
                                    setDataLine(journalSeguroAutoCartera,'line',[
                                            {fieldId:'account',value:accountDebitSeguroAuto},
                                            {fieldId:'debit',value:seguroAutoAmount},
                                            {fieldId:'entity',value:cliente},
                                            {fieldId:'cseg_grupo_conauto',value:grupoId},
                                            {fieldId:'cseg_folio_conauto',value:folio},
                                            {fieldId:'memo',value:memoSeguroAutoCartera},
                                            {fieldId:'class',value:classSeguroAutoId},
                                    ]);
                                    setDataLine(journalSeguroAutoCartera,'line',[
                                            {fieldId:'account',value:accountCreditSeguroAuto},
                                            {fieldId:'credit',value:seguroAutoAmount},
                                            {fieldId:'entity',value:cliente},
                                            {fieldId:'cseg_grupo_conauto',value:grupoId},
                                            {fieldId:'cseg_folio_conauto',value:folio},
                                            {fieldId:'memo',value:memoSeguroAutoCartera},
                                            {fieldId:'class',value:classSeguroAutoId},
                                    ]); */
                                                        setDataLine(journalSeguroAutoProvision, 'line', [
                                                                { fieldId: 'account', value: accountCreditSeguroAuto },
                                                                { fieldId: 'debit', value: seguroAutoAmount },
                                                                { fieldId: 'entity', value: cliente },
                                                                { fieldId: 'cseg_grupo_conauto', value: grupoId },
                                                                { fieldId: 'cseg_folio_conauto', value: folio },
                                                                { fieldId: 'memo', value: memoSeguroAutoProvision },
                                                                { fieldId: 'class', value: classSeguroAutoId },
                                                        ]);
                                                        setDataLine(journalSeguroAutoProvision, 'line', [
                                                                { fieldId: 'account', value: accountDebitSeguroAuto },
                                                                { fieldId: 'credit', value: seguroAutoAmount },
                                                                { fieldId: 'entity', value: cliente },
                                                                { fieldId: 'cseg_grupo_conauto', value: grupoId },
                                                                { fieldId: 'cseg_folio_conauto', value: folio },
                                                                { fieldId: 'memo', value: memoSeguroAutoProvision },
                                                                { fieldId: 'class', value: classSeguroAutoId },
                                                        ]);
                                                        /* //L.R.M.R. 24/08/2021 Solicitan que ya no se este generando este diario
                                    journalSeguroAutoCarteraId = journalSeguroAutoCartera.save({
                                            ignoreMandatoryFields:true
                                    });
                                    */
                                                        journalSeguroAutoProvisionId = journalSeguroAutoProvision.save({
                                                                ignoreMandatoryFields: true
                                                        });
                                                }
                                                journalId = journalObj.save({
                                                        ignoreMandatoryFields: true
                                                });
                                                //savePromosAmortizacion(amortizacionId,journalId,journalSeguroAutoCarteraId,journalSeguroAutoProvisionId); //L.R.M.R. 24/08/2021 Solicitan que ya no se este generando el diario journalSeguroAutoCarteraId
                                                savePromosAmortizacion(amortizacionId, journalId, journalSeguroAutoProvisionId);
                                        }

                                }
                        }
                }

                //function savePromosAmortizacion(amortizacionId,journalId,journalSeguroAutoId,journalSeguroAutoProvisionId){ //L.R.M.R. 24/08/2021 Solicitan que ya no se este generando el diario journalSeguroAutoId
                function savePromosAmortizacion(amortizacionId, journalId, journalSeguroAutoProvisionId) {
                        let amortizacionObj = record.load({
                                id: amortizacionId,
                                type: 'customrecord_imr_amortizacionconauto_enc',
                                isDynamic: true
                        });
                        amortizacionObj.setValue({
                                fieldId: 'custrecord_imr_amo_diario_prov_cartera',
                                value: journalId
                        });
                        /*	//L.R.M.R. 24/08/2021 Solicitan que ya no se este generando este diario
                        amortizacionObj.setValue({
            fieldId:'custrecord_imr_amo_diario_prov_seg_cart',
            value:journalSeguroAutoId
    });
    */
                        amortizacionObj.setValue({
                                fieldId: 'custrecord_imr_amo_diario_seg_cart',
                                value: journalSeguroAutoProvisionId
                        });
                        let countLine = amortizacionObj.getLineCount({
                                sublistId: 'recmachcustrecord_imr_amo_det_parent'
                        });
                        for (let i = 0; i < countLine; i++) {
                                amortizacionObj.selectLine({
                                        sublistId: 'recmachcustrecord_imr_amo_det_parent',
                                        line: i
                                });
                                let lineId = amortizacionObj.getCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_imr_amo_det_parent',
                                        fieldId: 'id'
                                }) || '';
                                let promocion = parseFloat(amortizacionObj.getCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_imr_amo_det_parent',
                                        fieldId: 'custrecordimr_promocion'
                                })) || 0;
                                let promocionAutomotriz = parseFloat(amortizacionObj.getCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_imr_amo_det_parent',
                                        fieldId: 'custrecordimr_promocionseguro'
                                })) || 0;
                                if (promocion || promocionAutomotriz) {
                                        let aux = 1;
                                }
                                log.error({
                                        title: 'promocion ' + lineId,
                                        details: JSON.stringify({
                                                promocionAutomotriz: promocionAutomotriz,
                                                promocion: promocion
                                        })
                                })
                                amortizacionObj.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_imr_amo_det_parent',
                                        fieldId: 'custrecord_imr_amo_det_pro_cartera',
                                        value: promocion
                                });
                                amortizacionObj.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_imr_amo_det_parent',
                                        fieldId: 'custrecord_imr_amo_det_pro_aut_cartera',
                                        value: promocionAutomotriz
                                });
                                amortizacionObj.commitLine({
                                        sublistId: 'recmachcustrecord_imr_amo_det_parent'
                                });
                        }
                        amortizacionObj.save({
                                ignoreMandatoryFields: true
                        });
                }

                /***
                *
                * @param {Object} data
                * @param {String} data.fecha fecha del calculo del interes
                * @param {Number} data.monto montot total del interes
                * @param {Number} logId
                */
                function interesesMoratorios(data, logId) {
                        let recordType = "customrecord_imr_intereses_moratorios";
                        let recordsId = [];
                        let recordObj = record.create({
                                type: recordType,
                                isDynamic: true
                        });
                        recordObj.setValue({
                                fieldId: "custrecord_imr_intmo_fecha",
                                value: getValueFormat("date", data.fecha)
                        });
                        recordObj.setValue({
                                fieldId: "custrecord_imr_intmo_monto_interes",
                                value: getValueFormat("number", data.monto)
                        });
                        recordObj.setValue({
                                fieldId: "custrecord_imr_logid_conauto20",
                                value: logId
                        })
                        recordsId.push(recordObj.save({
                                ignoreMandatoryFields: true
                        }));

                        let interesMoratorioData = record.load({
                                type: recordType,
                                id: recordsId[0],
                                isDynamic: true
                        })

                        return {
                                recordType: recordType,
                                transactions: [interesMoratorioData.getValue('custrecord_imr_intmo_transaccion')],
                                records: recordsId,
                                solPagos: [],
                                folios: []
                        }
                }

                function reservaPasivo(data, logId) {
                        const recordType = "customrecord_imr_poliza_adjudicados";
                        let recordsId = [];
                        let mapsReinstalacionClientes = [
                                {
                                        type: "number",
                                        field: "monto",
                                        fieldRecord: "custrecord_imr_padj_monto"
                                }, {
                                        type: "date",
                                        field: "fecha",
                                        fieldRecord: "custrecord_imr_padj_fecha"
                                }
                        ];
                        const recordObj = record.create({ type: recordType, isDynamic: true });
                        setDataRecord(mapsReinstalacionClientes, data, recordObj);
                        recordsId.push(recordObj.save({ ignoreMandatoryFields: true }));

                        let reservaPasivoData = record.load({
                                type: recordType,
                                id: recordsId[0],
                                isDynamic: true
                        })

                        return {
                                recordType: recordType,
                                transactions: [reservaPasivoData.getValue('custrecord_imr_padj_diario')],
                                records: recordsId,
                                solPagos: [],
                                folios: []
                        };
                }

                function bajaFolio(data, logId) {
                        let recordType = "customrecord_imr_baja_folio";
                        let recordsId = [];
                        let transactions = [];
                        let folios = [];

                        let folioId = recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                        if (folioId) {
                                folios.push(folioId);
                                data.folioId = folioId;
                                let recordObj = record.create({
                                        type: recordType,
                                        isDynamic: true
                                });
                                let fields = [
                                        {
                                                type: "text",
                                                field: "folioId",
                                                fieldRecord: "custrecord_imr_bafo_folio"
                                        },
                                        {
                                                type: "text",
                                                field: "estatus",
                                                fieldRecord: "custrecord_imr_bafo_estatus"
                                        },
                                        {
                                                type: "text",
                                                field: "tipoPago",
                                                fieldRecord: "custrecord_imr_bafo_tipo_pago"
                                        },
                                        {
                                                type: "text",
                                                field: "mes",
                                                fieldRecord: "custrecord_imr_bafo_mes"
                                        },
                                        {
                                                type: "number",
                                                field: "montoPenalizacion",
                                                fieldRecord: "custrecord_imr_bafo_monto_pena"
                                        },
                                        {
                                                type: "number",
                                                field: "reembolso",
                                                fieldRecord: "custrecord_imr_bafo_monto_pagar"
                                        }
                                ];
                                for (let field of fields) {
                                        let value = data[field.field]
                                        recordObj.setValue({
                                                fieldId: field.fieldRecord,
                                                value: value
                                        });
                                };

                                recordsId.push(recordObj.save({
                                        ignoreMandatoryFields: true
                                }));

                                let bajaFolio = record.load({
                                        type: recordType,
                                        id: recordsId[0],
                                        isDynamic: true
                                })

                                transactions.push(bajaFolio.getValue("custrecord_imr_bafo_transaccion"))
                        } else {
                                throw error.create({
                                        name: "FOLIO_NOT_FOUND",
                                        message: "NO se encontro el folio: " + data.folio
                                })
                        }


                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: recordsId,
                                solPagos: [],
                                folios: folios
                        };
                }

                function modificacionBajas(data) {
                        const recordType = "customrecord_imr_modificacion_bajas";
                        let recordsId = [];
                        let transactions = [];
                        let folios = [];

                        let folioId = recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                        if (folioId) {
                                folios.push(folioId);
                                data.folio = folioId;
                                let mapsReinstalacionClientes = [
                                        {
                                                type: "text",
                                                field: "folio",
                                                fieldRecord: "custrecord_imr_modbaja_folio"
                                        }, {
                                                type: "number",
                                                field: "saldoADevolver",
                                                fieldRecord: "custrecord_imr_modbaja_saldoadevolver"
                                        }, {
                                                type: "number",
                                                field: "penalizacion",
                                                fieldRecord: "custrecord_imr_modbaja_penalizacion"
                                        },
                                        {
                                                type: "text",
                                                field: "estado",
                                                fieldRecord: "custrecord_imr_modbaja_estatus_folio"
                                        }
                                ];
                                const recordObj = record.create({ type: recordType, isDynamic: true });
                                setDataRecord(mapsReinstalacionClientes, data, recordObj);
                                recordsId.push(recordObj.save({ ignoreMandatoryFields: true }))

                                let modificacionFolio = record.load({
                                        type: recordType,
                                        id: recordsId[0],
                                        isDynamic: true
                                })

                                let FieldJournalEntries = ["custrecord_imr_modbaja_diario_rescinbaja", "custrecord_imr_modbaja_diario_rescaplica", "custrecord_imr_modbaja_diario_cancbaja"]
                                for (let fieldId of FieldJournalEntries) {
                                        transactions.push(modificacionFolio.getValue(fieldId))
                                }

                        } else {
                                throw error.create({ name: "FOLIO_NOT_FOUND", message: "NO se encontro el folio: " + data.folio })
                        }

                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: recordsId,
                                solPagos: [],
                                folios: folios
                        };
                }

                function complementoBajas(data) {
                        const recordType = "customrecord_imr_complemento_bajas";
                        let recordsId = [];
                        let transactions = [];
                        let folios = [];


                        let folioId = recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);

                        if (folioId) {
                                folios.push(folioId);
                                data.folio = folioId;
                                let mapsReinstalacionClientes = [
                                        {
                                                type: "text",
                                                field: "folio",
                                                fieldRecord: "custrecord_imr_compbajas_folio"
                                        }, {
                                                type: "number",
                                                field: "saldoADevolver",
                                                fieldRecord: "custrecord_imr_compbajas_saldoadevolver"
                                        }, {
                                                type: "number",
                                                field: "penalizacion",
                                                fieldRecord: "custrecord_imr_compbajas_penalizacion"
                                        }, {
                                                type: "number",
                                                field: "originalPenalizacion",
                                                fieldRecord: "custrecord_imr_compbajas_pena_origen"
                                        }, {
                                                type: "number",
                                                field: "originalSaldoADevolver",
                                                fieldRecord: "custrecord_imr_compbajas_saldadev_origen"
                                        }, {
                                                type: "text",
                                                field: "tipoComplemento",
                                                fieldRecord: "custrecord_imr_tipo_complemento_bajas"
                                        }
                                ];
                                const recordObj = record.create({ type: recordType, isDynamic: true });
                                setDataRecord(mapsReinstalacionClientes, data, recordObj);
                                recordsId.push(recordObj.save({ ignoreMandatoryFields: true }))

                                let complementosFolio = record.load({
                                        type: recordType,
                                        id: recordsId[0],
                                        isDynamic: true
                                })

                                let FieldJournalEntries = ["custrecord_imr_compbajas_diario_can_comp", "custrecord_imr_compbajas_diario_prov", "custrecord_imr_compbajas_diario_prov_pag"]
                                for (let fieldId of FieldJournalEntries) {
                                        transactions.push(complementosFolio.getValue(fieldId))
                                }

                        } else {
                                throw error.create({ name: "FOLIO_NOT_FOUND", message: "NO se encontro el folio: " + data.folio })
                        }
                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: recordsId,
                                solPagos: [],
                                folios: folios
                        };
                }

                /**
                 *
                 * @param {Object} data
                 * @param {String} data.tipo  tipo de request
                 * @param {Object[]} data.pagos  arreglo de pagos
                 * @param {String} data.pagos[].referencia  referencia del pago
                 * @param {String} data.pagos[].fecha  fecha del pago formato DD/MM/YYYY
                 * @param {String} data.pagos[].folio  folio conauto
                 * @param {Number} data.pagos[].monto  importe del pago
                 * @param {String} data.pagos[].metodo  forma de pago
                 * @param {Object} response
                 * @param {Number} response.code
                 * @param {Array} response.info
                 */
                function aplicacionCobranza(data) {
                        log.debug("Data aplicacion cobranza", data);
                        let records = [];
                        let errors = [];
                        let recordType = "customrecord_imr_pagos_amortizacion";

                        let payments = data.pagos || [];
                        if (payments.length == 0) {
                                throw error.create({
                                        name: "EMPTY_PAYMENT_LIST_FIRSTPAYMENT",
                                        message: "La lista de pagos esta vacia"
                                })
                        }
                        let mandatoryFields = ["referencia", "fechaCobranza", "fechaPago", "folio", "monto", "aportacion", "total_pagar", "formaPago", "numPago"];
                        let line = 0;
                        for (let payment of payments) {
                                line++;
                                checkMandatoryFields(payment, mandatoryFields, line, errors);
                        }
                        if (errors.length == 0) {
                                let fields = [
                                        {
                                                type: "text",
                                                field: "folio",
                                                fieldRecord: "custrecord_imr_pa_folio_texto"
                                        },
                                        {
                                                type: "number",
                                                field: "monto",
                                                fieldRecord: "custrecord_imr_pa_importe"
                                        },
                                        {
                                                type: "number",
                                                field: "aportacion",
                                                fieldRecord: "custrecord_conauto_aportacion"
                                        },
                                        {
                                                type: "number",
                                                field: "gastos",
                                                fieldRecord: "custrecord_conauto_gastos"
                                        },
                                        {
                                                type: "number",
                                                field: "iva",
                                                fieldRecord: "custrecord_conauto_iva"
                                        },
                                        {
                                                type: "number",
                                                field: "seguro_auto",
                                                fieldRecord: "custrecord_conauto_seguro_auto"
                                        },
                                        {
                                                type: "number",
                                                field: "seguro_vida",
                                                fieldRecord: "custrecord_conauto_seguro_vida"
                                        },
                                        {
                                                type: "number",
                                                field: "total_pagar",
                                                fieldRecord: "custrecord_conauto_total_pagar"
                                        },
                                        {
                                                type: "text",
                                                field: "formaPago",
                                                fieldRecord: "custrecord_imr_pa_forma_pago",
                                                callback: function (value) { return getFormaPago(value) }
                                        },
                                        {
                                                type: "date",
                                                field: "fechaCobranza",
                                                fieldRecord: "custrecord_imr_pa_fecha"
                                        },
                                        {
                                                type: "date",
                                                field: "fechaPago",
                                                fieldRecord: "custrecord_imr_pa_fecha_pago"
                                        },
                                        {
                                                type: "text",
                                                field: "referencia",
                                                fieldRecord: "custrecord_imr_pa_referencia",
                                                callback: function (value) {
                                                        return (value || '').substring(0, 2)
                                                }
                                        },
                                        {
                                                type: "text",
                                                field: "referencia",
                                                fieldRecord: "custrecord_imr_pa_referencia_completa"
                                        },
                                        {
                                                type: "text",
                                                field: "id",
                                                fieldRecord: "externalid"
                                        },
                                        {
                                                type: "text",
                                                field: "numPago",
                                                fieldRecord: "custrecord_conauto_num_payment_service"
                                        }
                                ]
                                for (let payment of payments) {
                                        log.debug("a crear payment", payment);
                                        let recordPagoObj = record.create({
                                                type: recordType,
                                                isDynamic: true
                                        });
                                        for (let field of fields) {
                                                let fieldId = field.fieldRecord;
                                                let value = payment[field.field];
                                                if (field.callback) {
                                                        value = field.callback(value);
                                                }
                                                value = getValueFormat(field.type, value);
                                                recordPagoObj.setValue({
                                                        fieldId: fieldId,
                                                        value: value
                                                });
                                        }
                                        try {
                                                let recordPagoId = recordPagoObj.save({
                                                        ignoreMandatoryFields: true
                                                });
                                                records.push(recordPagoId);
                                        } catch (e) {
                                                errors.push(e.toString())
                                        }
                                }
                        } else {
                                throw error.create({
                                        name: "DATA_ERROR_PAYMENTS",
                                        message: errors.join("\n")
                                })
                        }

                        return {
                                recordType: recordType,
                                transactions: [],
                                records: records,
                                solPagos: [],
                                folios: [],
                                errors: errors
                        };
                }

                function applyPaymentLine(recordObj, line) {
                        let payments = 0;
                        let fields = ['custrecord_imr_amo_det_aplapo', 'custrecord_imr_amo_aplgtos', 'custrecord_imr_amo_det_aplivagts', 'custrecord_imr_amo_det_aplsegvida', 'custrecord_imr_amo_det_aplsegaut',
                                'custrecord_imr_amo_det_aplintpe', 'custrecord_imr_amo_det_montoapl'];
                        for (let field of fields) {
                                payments += parseFloat(recordObj.getSublistValue({
                                        sublistId: 'recmachcustrecord_imr_amo_det_parent',
                                        fieldId: field,
                                        line: line
                                })) || 0;
                        };
                        return payments > 0;
                }

                function getValueFormat(type, value) {
                        switch (type) {
                                case 'date':
                                        value = stringToDateConauto(value);
                                        break;
                                case 'number':
                                        value = parseFloat(value) || 0;
                                        break;
                                default:
                        }
                        return value;
                }

                function checkMandatoryFields(data, mandatoryFields, line, errors) {
                        for (let field of mandatoryFields) {
                                let value = data[field];
                                if (!(value || parseFloat(value) === 0 || util.isBoolean(value))) {
                                        errors.push((line ? ('Linea ' + line + ': ') : '') + 'El campo ' + field + ' no debe de estar vacio');
                                }
                        }
                }

                function parseFloatRound(value, decimals) {
                        return parseFloat((parseFloat(value) || 0).toFixed(decimals || 2));
                }

                function stringToDateConauto(value) {
                        if (value) {
                                let arrayDate = value.split('/');
                                return new Date(arrayDate[2], arrayDate[1] - 1, arrayDate[0]);
                        } else {
                                return null;
                        }
                }

                function recordFind(recordType, operator, field, value) {
                        let id = null;
                        if (value) {
                                let results = search.searchAllRecords({
                                        type: recordType,
                                        filters: [
                                                search.createFilter({
                                                        name: field,
                                                        operator: operator,
                                                        values: [value]
                                                })
                                        ],
                                        columns: [
                                                search.createColumn({
                                                        name: 'internalid'
                                                })
                                        ]
                                });
                                if (results.length > 0) {
                                        id = results[0].getValue({
                                                name: 'internalid'
                                        });
                                }
                        }
                        return id;
                }

                function setOpcionalData(recordObj, value, field) {
                        if (value || parseFloat(value) === 0) {
                                recordObj.setValue({
                                        fieldId: field,
                                        value: value
                                })
                        }
                }

                function setDataRecord(maps, data, record) {
                        for (let dataField of maps) {
                                if (Object.getOwnPropertyNames(data).indexOf(dataField.field) != -1) {
                                        let value = data[dataField.field];
                                        value = getValueFormat(dataField.type, value);
                                        record.setValue({
                                                fieldId: dataField.fieldRecord,
                                                value: value
                                        })
                                }
                        }
                }

                function getFormaPago(value) {
                        //log.error('getFormaPago',value)
                        let values = { '12': '102', '13': '108', '14': '103', '15': '109', '17': '104', '23': '110', '24': '105', '25': '111', '26': '106', '27': '112', '28': '120', '29': '121', '30': '107', '31': '101', '99': '99', '01': '1', '02': '2', '03': '3', '04': '4', '05': '5', '06': '6', '08': '8', 'X': '100', '1': '1', '2': '2', '3': '3' };
                        //return values[value.toString()]||null; //L.R.M.R. 06/05/2022 Se coloca a toString porque estaba eliminando el cero
                        return values[value] || null;
                }

                function getRequestLog(logId) {
                        let log = record.load({
                                id: logId,
                                type: 'customrecord_log_service_conauto'
                        });
                        let processed = log.getValue({
                                fieldId: 'custrecord_log_serv_processed'
                        });
                        // if(processed) {
                        //         throw error.create({
                        //                 name:'LOG_PROCESSED',
                        //                 message:'EL LOG YA SE ENCUENTRA PROCESADO'
                        //         });
                        // }
                        let requestFileId = log.getValue({
                                fieldId: 'custrecord_log_serv_request'
                        });
                        let request = file.load({
                                id: requestFileId
                        });
                        return JSON.parse(request.getContents());
                }

                /***
                *
                * @param {Record} transaccionObj
                * @param {Array} values
                * @param {String} sublistId
                */
                function setDataLine(transaccionObj, sublistId, values) {
                        transaccionObj.selectNewLine({
                                sublistId: sublistId
                        });
                        for (let i = 0; i < values.length; i++) {
                                let field = values[i];
                                transaccionObj.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: field.fieldId,
                                        value: field.value
                                })
                        }
                        transaccionObj.commitLine({
                                sublistId: sublistId
                        });
                }

                function createRecordHeader(recordType, preferences, memo, type) {
                        let journalObj = record.create({
                                type: recordType,
                                isDynamic: true
                        });
                        let subsidiary = preferences.getPreference({
                                key: 'SUBCONAUTO'
                        });
                        journalObj.setValue({
                                fieldId: 'subsidiary',
                                value: subsidiary
                        });
                        journalObj.setValue({
                                fieldId: 'custbody_tipo_transaccion_conauto',
                                value: type
                        });
                        journalObj.setValue({
                                fieldId: 'memo',
                                value: memo
                        });
                        journalObj.setValue({
                                fieldId: 'currency',
                                value: 1
                        });
                        return journalObj;
                }

                exports.execute = execute;
                return exports;
        });