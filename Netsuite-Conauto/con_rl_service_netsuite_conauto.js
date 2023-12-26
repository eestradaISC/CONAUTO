/**
* @author Ashanty Uh Canul 
* @Modificacion <>
* @Name con_rl_service_netsuite_conauto.js
* @description Servicio de conexión entre Progress y Netsuite
* @file <URL PENDIENTE>
* @NApiVersion 2.1
* @NScriptType Restlet
* @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
*/
define([
    'N/record',
    'N/file',
    'IMR/IMRSearch',
    '/SuiteScripts/Conauto_Preferences.js',
    //'N/task', 
    //'SuiteScripts/scripts/Netsuite-Conauto/library/con_.js', 
    //'SuiteScripts/scripts/Netsuite-Conauto/library/con_.js',
    //'SuiteScripts/scripts/Netsuite-Conauto/library/con_.js'
],
    function (
        record,
        file,
        search,
        conautoPreferences,
        //task, 
        https) {

        /**
        * @param request
        *        {String|Object} The request body as a String when
        *            <code>Content-Type</code> is <code>text/plain</code>; The
        *            request body as an Object when request
        *            <code>Content-Type</code> is <code>application/json</code>
        *
        * @return {String|Object} Returns a String when request
        *         <code>Content-Type</code> is <code>text/plain</code>;
        *         returns an Object when request <code>Content-Type</code> is
        *         <code>application/json</code>
        *
        * @static
        * @function post
        */
        function postRequest(request) {
            let response = { code: 300, info: [] };
            try {
                let data = request || {};
                let operations = {
                    'PrimerasCuotas': primerasCuotas,
                    'SolicitudPago': solicitudPago,
                    'PolizaIntegrantes': polizaIntegrantes,
                    'ActualizaContrato': actualizaContrato,
                    'PagoUnidad': pagoUnidad,
                    'InteresesMoratorios': interesesMoratorios,
                    'ReservaPasivo': reservaPasivo,
                    'Bajas': bajaFolio,
                    'ModificacionBajas': modificacionBajas,
                    'ComplementoBajas': complementoBajas,
                    'AplicacionCobranza': aplicacionCobranza,
                    'CobranzaIdentificada': cobranzaIdentificada,
                    'ProvisionCartera': provisionCartera,
                    'CambiarEstatus': cambiarEstatus,
                    'ReclasificacionPrimeraCuota': reclasificacionPrimeraCuota,
                }
                let callback = operations[data.tipo];
                if (callback) {
                    try {
                        callback(data, response);
                    } catch (e) {
                        response.code = 400;
                        response.info.push('ERROR POST REQUEST: ' + e.toString());
                    }
                } else {
                    response = { code: 404, info: ['OPERACIÓN ' + data.tipo + ' INVÁLIDA'] };
                }
                successRequest(response);
            } catch (e) {
                response.code = 500;
                response.info.push('ERROR POST REQUEST: ' + e.toString());
            }
            return response;
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
        * 
        * 
        */
        function primerasCuotas(data, response) {
            let logId = null;
            let pagosInfo = data.pagos || [];
            logId = createLog(data, response);
            response.logId = logId;
            if (pagosInfo.length > 0) {
                //code
            } else {
                response.code = 400;
                response.info.push('NO SE ENCONTRARON PAGOS A REGISTRAR EN LA PETICIÓN');
                handlerErrorLogRequest('NO SE ENCONTRARON PAGOS A REGISTRAR EN LA PETICIÓN', logId);
            }
        }

        /**
        * @param {Object} data
        * @param {String} data.tipo 
        * @param {String} data.idNotificacion 
        * @param {Array}  data.detalles 
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array}  response.info
        * 
        * 
        */
        function solicitudPago(data, response) {
            let logId = null;
            let detalles = data.detalles || [];
            logId = createLog(data, response);
            response.logId = logId;
            if (detalles.length > 0) {
                for (let i = 0; i < detalles.length; i++) {
                    let detalle = detalles[i];
                    let mandatoryFields = ['tipoMovimiento', 'monto', 'beneficiario'];
                    if (detalle.tipoMovimiento != 3) mandatoryFields.push('cuentaBancaria')
                    checkMandatoryFields(detalle, mandatoryFields, response, i + 1);
                    if (detalle.banco && ['1', '18', '19', '20', '21', '22', '23', '24', '5', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '6', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '7', '2', '8', '9', '10', '11', '12', '13', '14', '3', '15', '54', '55', '56', '57', '58', '59', '60', '61', '62', '16', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '17', '4', '84', '85', '86'].indexOf(detalle.banco) == -1) {
                        response.code = 400;
                        response.info.push('ID DE BANCO NO VÁLIDO: ' + detalle.banco + ' - LÍNEA:' + i);
                    }
                    if (!util.isObject(detalle.beneficiario)) {
                        response.code = 400;
                        response.info.push('LA ESTRUCTURA DEL NODO BENEFICIARIO ESTA INCORRECTA - LÍNEA: ' + (i + 1));
                    } else if (detalle.beneficiario) {
                        let mandatoryFieldsBeneficiario = ['rfc', 'nombre'];
                        checkMandatoryFields(detalle.beneficiario, mandatoryFieldsBeneficiario, response, i + 1);
                    }
                }
            } else {
                response.code = 400;
                response.info.push('NO SE ENCONTRARON DETALLES EN LA PETICIÓN');
                handlerErrorLogRequest('NO SE ENCONTRARON DETALLES EN LA PETICIÓN', logId);
            }
        }

        /***
        * @param {Object} data
        * @param {Number} data.totalPagado monto de pago
        * @param {String} data.fecha fecha de contabilización
        * @param response
        * @param {Number} response.code
        * @param {Array} response.Info
        */
        function polizaIntegrantes(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            if (data.idNotificacion.length > 0) {
                let mandatoryFields = ['totalPagado', 'fecha',];
                checkMandatoryFields(data, mandatoryFields, response);
                checkMandatoryFieldsDate(data, ['fecha'], response);
            } else {
                response.code = 400;
                response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
            }
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
        * 
        * 
        */
        function actualizaContrato(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            try {
                if (data.idNotificacion.length > 0) {
                    let folioId = recordFind('customrecord_cseg_folio_conauto', 'anyof', 'externalid', data.folio);
                    if (folioId) {
                        if (data.pagoCon && ['1', '2'].indexOf(data.pagoCon + '') == -1) {
                            response.code = 400;
                            response.info.push('ID DE pagoCon NO VÁLIDO: ' + data.pagoCon);
                        }
                        if (data.estado && ['1', '2', '3', '4'].indexOf(data.estado + '') == -1) {
                            response.code = 400;
                            response.info.push('ID DE estatus NO VÁLIDO: ' + data.estado);
                        }
                        if (data.subestado && ['1', '2', '3', '4', '5', '6', '7', '8', ''].indexOf(data.subestado + '') == -1) {
                            response.code = 400;
                            response.info.push('ID DE sub estatus NO VÁLIDO: ' + data.subestado);
                        }
                        checkMandatoryFieldsDate(data, ['fechaContrato', 'fechaRecepcion'], response);
                        if (data.cliente && !util.isObject(data.cliente)) {
                            response.code = 400;
                            response.info.push('ESTRUCTURA NODO cliente INCORRECTA');
                        } else if (data.cliente) {
                            let mandatoryFieldsCliente = ['nombre', 'rfc'];
                            if (data.cliente.esPersona) {
                                mandatoryFieldsCliente.push('apellidoPaterno');
                                // mandatoryFieldsCliente.push('apellidoMaterno');
                            }
                            checkMandatoryFieldsDate(data.cliente, ['fechaNacimiento'], response);
                            checkMandatoryFields(data.cliente, mandatoryFieldsCliente, response);
                            if (Object.getOwnPropertyNames(data.cliente).indexOf('esPersona') != -1 && !util.isBoolean(data.cliente.esPersona)) {
                                response.code = 400;
                                response.info.push('CAMPO esPersona NO ES VALOR BOOLEANO');
                            }
                            if (Object.getOwnPropertyNames(data.cliente).indexOf('sexo') != -1 && !util.isBoolean(data.cliente.sexo)) {
                                response.code = 400;
                                response.info.push('CAMPO sexo NO ES VALOR BOOLEANO');
                            }
                            if (data.cliente.direccion && !util.isObject(data.cliente.direccion)) {
                                response.code = 400;
                                response.info.push('ESTRUCTURA NODO direccion INCORRECTA');
                            } else if (data.cliente.direccion) {
                                let mandatoryFieldsDireccion = ['calle', 'colonia', 'estado', 'cp'];
                                checkMandatoryFields(data.cliente.direccion, mandatoryFieldsDireccion, response);
                            }
                        }
                        if (data.grupo && !util.isObject(data.grupo)) {
                            response.code = 400;
                            response.info.push('ESTRUCTURA NODO grupo INCORRECTA');
                        } else if (data.grupo) {
                            let mandatoryFieldsGrupo = ['id', 'nombre'];
                            checkMandatoryFields(data.grupo, mandatoryFieldsGrupo, response);
                            checkMandatoryFieldsDate(data.grupo, ['finVigencia'], response);
                        }
                    } else {
                        folioId = recordFind('customrecord_cseg_folio_conauto', 'is', 'name', data.folio);
                        if (folioId) {
                            if (data.pagoCon && ['1', '2'].indexOf(data.pagoCon + '') == -1) {
                                response.code = 400;
                                response.info.push('ID DE pagoCon NO VÁLIDO: ' + data.pagoCon);
                            }
                            if (data.estado && ['1', '2', '3', '4'].indexOf(data.estado + '') == -1) {
                                response.code = 400;
                                response.info.push('ID DE estatus NO VÁLIDO: ' + data.estado);
                            }
                            if (data.subestado && ['1', '2', '3', '4', '5', '6', '7', '8', ''].indexOf(data.subestado + '') == -1) {
                                response.code = 400;
                                response.info.push('ID DE sub estatus NO VÁLIDO: ' + data.subestado);
                            }
                            checkMandatoryFieldsDate(data, ['fechaContrato', 'fechaRecepcion'], response);
                            if (data.cliente && !util.isObject(data.cliente)) {
                                response.code = 400;
                                response.info.push('ESTRUCTURA NODO cliente INCORRECTA');
                            } else if (data.cliente) {
                                let mandatoryFieldsCliente = ['nombre', 'rfc'];
                                if (data.cliente.esPersona) {
                                    mandatoryFieldsCliente.push('apellidoPaterno');
                                    // mandatoryFieldsCliente.push('apellidoMaterno');
                                }
                                checkMandatoryFieldsDate(data.cliente, ['fechaNacimiento'], response);
                                checkMandatoryFields(data.cliente, mandatoryFieldsCliente, response);
                                if (Object.getOwnPropertyNames(data.cliente).indexOf('esPersona') != -1 && !util.isBoolean(data.cliente.esPersona)) {
                                    response.code = 400;
                                    response.info.push('CAMPO esPersona NO ES VALOR BOOLEANO');
                                }
                                if (Object.getOwnPropertyNames(data.cliente).indexOf('sexo') != -1 && !util.isBoolean(data.cliente.sexo)) {
                                    response.code = 400;
                                    response.info.push('CAMPO sexo NO ES VALOR BOOLEANO');
                                }
                                if (data.cliente.direccion && !util.isObject(data.cliente.direccion)) {
                                    response.code = 400;
                                    response.info.push('ESTRUCTURA NODO direccion INCORRECTA');
                                } else if (data.cliente.direccion) {
                                    let mandatoryFieldsDireccion = ['calle', 'colonia', 'estado', 'cp'];
                                    checkMandatoryFields(data.cliente.direccion, mandatoryFieldsDireccion, response);
                                }
                            }
                            if (data.grupo && !util.isObject(data.grupo)) {
                                response.code = 400;
                                response.info.push('ESTRUCTURA NODO grupo INCORRECTA');
                            } else if (data.grupo) {
                                let mandatoryFieldsGrupo = ['id', 'nombre'];
                                checkMandatoryFields(data.grupo, mandatoryFieldsGrupo, response);
                                checkMandatoryFieldsDate(data.grupo, ['finVigencia'], response);
                            }
                        } else {
                            response.code = 400;
                            response.info.push('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID O NAME, VERIFICA EL REGISTRO DEL FOLIO');
                            handlerErrorLogRequest('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID, VERIFICA EL REGISTRO DEL FOLIO', logId);
                        }
                    }
                } else {
                    response.code = 400;
                    response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                    handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
                }
            } catch (e) {
                response.code = 400;
                response.info.push(e);
                handlerErrorLogRequest(e, logId);
            }
        }

        function pagoUnidad(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            let folioId = '';
            try {
                if (data.idNotificacion.length > 0) {
                    folioId = recordFind('customrecord_cseg_folio_conauto', 'anyof', 'externalid', data.folio);
                    if (folioId) {
                        let mandatoryFields = ['folio', 'folioFactura', 'factura', 'cartaCredito', 'diferenciaCCVF', 'bid', 'vehiculoEnt', 'totalPagar'];
                        checkMandatoryFields(data, mandatoryFields, response);
                    } else {
                        response.code = 400;
                        response.info.push('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID O NAME, VERIFICA EL REGISTRO DEL FOLIO');
                        handlerErrorLogRequest('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID, VERIFICA EL REGISTRO DEL FOLIO', logId);
                    }
                } else {
                    response.code = 400;
                    response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                    handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
                }
            } catch (e) {
                response.code = 400;
                response.info.push(e);
                handlerErrorLogRequest(e, logId);
            }

        }

        /**
        *
        * @param data
        * @param {String} data.idNotificacion
        * @param {String} data.tipo
        * @param {Double} data.monto
        * @param {String} data.fecha
        * @param response
        * @param {Array} response.Info
        */
        function interesesMoratorios(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            if (data.idNotificacion.length > 0) {
                let mandatoryFields = ["idNotificacion", "tipo", "fecha", "monto",];
                checkMandatoryFields(data, mandatoryFields, response);
                checkMandatoryFieldsDate(data, ["fecha"], response);
            }
            else {
                response.code = 400;
                response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
            }

        }


        /**
        *
        * @param {Object} data
        * @param {String} data.idNotificacion
        * @param {String} data.tipo
        * @param {Double} data.monto
        * @param {String} data.fecha
        * @param {Object} response
        * @param {Number} response.code 
        * @param {Array} response.Info
        */
        function reservaPasivo(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            if (data.idNotificacion.length > 0) {
                let mandatoryFields = ["idNotificacion", "tipo", "fecha", "monto",];
                checkMandatoryFields(data, mandatoryFields, response);
                checkMandatoryFieldsDate(data, ["fecha"], response);
            }
            else {
                response.code = 400;
                response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
            }

        }

        /***
        *
        * @param {Object} data
        * @param {String} data.idNotificacion
        * @param {String} data.tipo  tipo de request
        * @param {String} data.folio folio a dar de baja
        * @param {String} data.mes id del mes de baja
        * @param {Number} data.estatus Id del estatus de la baja
        * @param {Number} data.tipoPago tipo de pago
        * @param {Number} data.montoPenalizacion monto por penalizacion
        * @param {Number} data.montoPagar monto por pagar
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array} response.info
        */
        function bajaFolio(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            try {
                let folioId = recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                if (folioId) {
                    let mandatoryFields = ["mes", "estatus", "montoPagar", "montoPenalizacion", "idNotificacion"];
                    checkMandatoryFields(data, mandatoryFields, response);
                } else {
                    response.code = 304;
                    response.info.push("Folio: " + data.folio + " no existe en netsuite");
                }
            } catch (e) {
                response.code = 400;
                response.info.push(e);
                handlerErrorLogRequest(e, logId);
            }

        }

        /***
        *
        * @param {Object} data
        * @param {String} data.idNotificacion
        * @param {String} data.tipo  tipo de request
        * @param {String} data.folio folio para modificar baja
        * @param {Number} data.saldoADevolver monto de saldo a devolver
        * @param {Number} data.penalizacion monto de la penalización
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array} response.info
        */
        function modificacionBajas(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;

            let folioId = recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
            if (folioId) {
                const mandatoryFields = ["folio", "saldoADevolver", "penalizacion", "estado"];
                checkMandatoryFields(data, mandatoryFields, response);
            } else {
                response.code = 304;
                response.info.push("Folio: " + data.folio + " no existe en netsuite");
            }
        }

        /***
        *
        * @param {Object} data
        * @param {String} data.idNotificacion
        * @param {String} data.tipo  tipo de request
        * @param {String} data.folio folio para complementos de bajas
        * @param {Number} data.saldoADevolver monto de saldo a devolver
        * @param {Number} data.penalizacion monto de la penalización
        * @param {Number} data.originalSaldoADevolver monto original de saldo a devolver
        * @param {Number} data.originalPenalizacion monto original de la penalización
        * @param {Number} data.tipoComplemento tipo de complemento
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array} response.info
        */
        function complementoBajas(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            try {
                let folioId = recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                if (folioId) {
                    let mandatoryFields = ["folio", "saldoADevolver", "penalizacion", "originalSaldoADevolver", "originalPenalizacion", "tipoComplemento", "idNotificacion"];
                    checkMandatoryFields(data, mandatoryFields, response);
                } else {
                    response.code = 304;
                    response.info.push("Folio: " + data.folio + " no existe en netsuite");
                }
            } catch (e) {
                response.code = 400;
                response.info.push(e);
                handlerErrorLogRequest(e, logId);
            }
        }

        /**
        *
        * @param {Object} data
        * @param {String} data.tipo  tipo de request
        * @param {Number} data.idNotificacion id de la cual proviene la petición
        * @param {Object[]} data.pagos  arreglo de pagos
        * @param {String} data.pagos[].referencia  referencia del pago
        * @param {String} data.pagos[].fechaCobranza  fecha del pago formato DD/MM/YYYY
        * @param {String} data.pagos[].fechaPago  fecha del pago formato DD/MM/YYYY
        * @param {String} data.pagos[].folio  folio conauto
        * @param {String} data.pagos[].status  status del cliente conauto
        * @param {Number} data.pagos[].monto  importe del pago
        * @param {String} data.pagos[].formaPago  forma de pago
        * @param {String} data.pagos[].numPago  número consecutivo del pago
        * @param {String} data.pagos[].grupo identificador del grupo
        * @param {String} data.pagos[].cliente ID del cliente
        * @param {Number} data.pagos[].aportacion Monto de la aportacion
        * @param {Number} data.pagos[].gastos Monto neto de los gastos
        * @param {Number} data.pagos[].iva IVA obtenido de los gastos
        * @param {Number} data.pagos[].seguro_auto Monto utilizado para el seguro de auto
        * @param {Number} data.pagos[].seguro_vida Monto utilizado para el seguro de vida
        * @param {Number} data.pagos[].total_pagar Suma de todos los montos excluyendo monto
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array} response.info
        */
        function aplicacionCobranza(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;

            let payments = data.pagos || [];
            if (payments.length == 0) {
                response.code = 303;
                response.info.push("No se encontraron pagos a regitrar en la petición");
                return;
            }
            let preferences = conautoPreferences.get();
            let folios = [];
            let mandatoryFields = ["referencia", "fechaCobranza", "fechaPago", "folio", "monto", "aportacion", "total_pagar", "formaPago", "numPago", "id"];

            let d = new Date();
            let paymentTime = d.getTime();
            log.debug("PaymentTime", paymentTime)
            for (let i = 0; i < payments.length; i++) {
                let total = 0;


                let payment = payments[i];
                payment.id = [getDateExternalid(payment.fechaPago), payment.referencia, payment.folio, parseFloat(payment.monto).toFixed(2), payment.numPago].join("_");

                checkMandatoryFields(payment, mandatoryFields, response, i + 1);
                checkMandatoryFieldsDate(payment, ["fechaCobranza", "fechaPago"], response, i + 1);
                if (payment.folio) {
                    folios.push(payment.folio);
                }
            }

            for (let i = 0; i < payments.length; i++) {
                let payment = payments[i];

                if (payment.referencia) {
                    let account = preferences.getPreference({
                        key: "CB1P",
                        reference: (payment.referencia || '').substring(0, 2)
                    });
                    if (!account) {
                        response.code = 305;
                        response.info.push("Linea " + (i + 1) + ": Referencia \"" + (payment.referencia || '').substring(0, 2) + "\" no valida");
                    }
                }
            }

        }

        /**
        *
        * @param {Object} data
        * @param {String} data.tipo  tipo de request
        * @param {Number} data.idNotificacion id de la cual proviene la petición
        * @param {Object[]} data.pagos  arreglo de pagos
        * @param {String} data.pagos[].fecha  fecha del pago formato DD/MM/YYYY
        * @param {Number} data.pagos[].status TODO: Por definir
        * @param {String} data.pagos[].folioContrato  folio conauto
        * @param {String} data.pagos[].grupo identificador del grupo
        * @param {Number} data.pagos[].integrante TODO: Por definiri
        * @param {Number} data.pagos[].total_pagar Suma de todos los montos
        * @param {Number} data.pagos[].cliente TODO: Por definir
        * @param {Number} data.pagos[].aportacion Monto de la aportacion
        * @param {Number} data.pagos[].gastos Monto neto de los gastos
        * @param {Number} data.pagos[].iva IVA obtenido de los gastos
        * @param {Number} data.pagos[].seguro_auto Monto utilizado para el seguro de auto
        * @param {Number} data.pagos[].seguro_vida Monto utilizado para el seguro de vida
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array} response.info
        */
        function provisionCartera(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;

            let payments = data.pagos || [];
            if (payments.length == 0) {
                response.code = 303;
                response.info.push("No se encontraron pagos a regitrar en la petición");
                return;
            }
            let preferences = conautoPreferences.get();
            let folios = [];
            let mandatoryFields = ["fecha", "status", "folioContrato", "grupo", "integrante", "total_pagar", "cliente", "aportacion"];
            let currencyFields = ["aportacion", "gastos", "iva", "seguro_auto", "seguro_vida"]

            for (let i = 0; i < payments.length; i++) {
                let total = 0;


                let payment = payments[i];
                for (let currencyField of currencyFields) {
                    log.error("MONTO", payment[currencyField])
                    total += payment[currencyField]
                }

                if (payment["total_pagar"].toFixed(2) != total.toFixed(2)) {
                    response.code = 303;
                    response.info.push(`La suma de los montos no coinciden con el total a pagar |TOTAL A PAGAR: ${payment["total_pagar"]} - SUMA DE MONTOS: ${total}|`);
                    return;
                }
                payment.id = [getDateExternalid(payment.fechaPago), payment.referencia, payment.folio, parseFloat(payment.monto).toFixed(2), payment.numPago].join("_");

                checkMandatoryFields(payment, mandatoryFields, response, i + 1);
                checkMandatoryFieldsDate(payment, ["fecha"], response, i + 1);
                if (payment.folio) {
                    folios.push(payment.folio);
                }
            }

            // TODO: Se utilizara posteriormente en caso de necesitar referencia
            // for (let i = 0; i < payments.length; i++) {
            //     let payment = payments[i];

            //     if (payment.referencia) {
            //         let account = preferences.getPreference({
            //             key: "CB1P",
            //             reference: (payment.referencia || '').substring(0, 2)
            //         });
            //         if (!account) {
            //             response.code = 305;
            //             response.info.push("Linea " + (i + 1) + ": Referencia \"" + (payment.referencia || '').substring(0, 2) + "\" no valida");
            //         }
            //     }
            // }

        }

        /**
        *
        * @param {Object} data
        * @param {String} data.tipo  tipo de request
        * @param {Number} data.idNotificacion id de la cual proviene la petición
        * @param {String} data.folio  folio al cual se cambiara el estatus
        * @param {Number} data.estatus nuevo estatus
        * @param {String} data.subestatus  nuevo subestado del folio
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array} response.info
        */
        function cambiarEstatus(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;


            try {
                let folioId = recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                if (folioId) {
                    let mandatoryFields = ["folio", "estatus"];

                    if (data?.subestatus && ["3", "4", "5", "6", "7", "8", ""].indexOf(data?.subestatus) == -1) {
                        response.code = 302;
                        response.info.push("Id de sub estatus no valido: " + data.subestatus);
                    }
                    checkMandatoryFields(data, mandatoryFields, response);
                    if ([1, 2, 3, 4].indexOf(data.estatus) == -1) {
                        response.code = 302;
                        response.info.push("Id de estatus no valido: " + data.estatus);
                    }
                } else {
                    response.code = 304;
                    response.info.push("Folio: " + data.folio + " no existe en NetSuite");
                }
            } catch (e) {
                response.code = 400;
                response.info.push(e);
                handlerErrorLogRequest(e, logId);
            }
        }

        /**
        *
        * @param {Object} data
        * @param {String} data.tipo  tipo de request
        * @param {Number} data.idNotificacion id de la cual proviene la petición
        * @param {Object[]}  data.pagos  pagos a registrar
        * @param {String} data.pagos.folio  folio al cual se registrara el pago
        * @param {String} data.pagos.referencia  referencia del pago
        * @param {Date}   data.pagos.fecha  fecha de cobranza
        * @param {Array}  data.pagos.monto  monto
        * @param {String} data.pagos.grupo  grupo del cliente
        * @param {String} data.pagos.cliente  cliente
        * @param {String} data.pagos.formaPago  forma del pago
        * @param {Number} data.pagos.importe  importe total
        * @param {Number} data.pagos.totalPagado  total pagado
        * @param {Number} data.pagos.aportacion  reclasificación aportación
        * @param {Number} data.pagos.gastos  reclasificación gastos
        * @param {Number} data.pagos.iva  reclasificación iva
        * @param {Number} data.pagos.seguro_auto  reclasificación seguro de auto
        * @param {Number} data.pagos.seguro_vida  reclasificación seguro de vida
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array}  response.info
        */
        function reclasificacionPrimeraCuota(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;

            let payments = data.pagos || [];
            if (payments.length == 0) {
                response.code = 303;
                response.info.push("No se encontraron pagos para relasificar en la petición");
                return;
            }
            let preferences = conautoPreferences.get();
            let folios = [];
            let mandatoryFields = ["referencia", "fecha", "folio", "monto", "aportacion", "totalPagado", "formaPago"];

            let d = new Date();
            let paymentTime = d.getTime();
            log.debug("PaymentTime", paymentTime)
            for (let i = 0; i < payments.length; i++) {
                let payment = payments[i];
                payment.id = [getDateExternalid(payment.fechaPago), payment.referencia, payment.folio, parseFloat(payment.monto).toFixed(2), payment.numPago].join("_");

                checkMandatoryFields(payment, mandatoryFields, response, i + 1);
                checkMandatoryFieldsDate(payment, ["fecha"], response, i + 1);
                if (payment.folio) {
                    folios.push(payment.folio);
                }
            }

            for (let i = 0; i < payments.length; i++) {
                let payment = payments[i];

                if (payment.referencia) {
                    let account = preferences.getPreference({
                        key: "CB1P",
                        reference: (payment.referencia || '').substring(0, 2)
                    });
                    if (!account) {
                        response.code = 305;
                        response.info.push("Linea " + (i + 1) + ": Referencia \"" + (payment.referencia || '').substring(0, 2) + "\" no valida");
                    }
                }
            }
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
         * @param {String} data.pagos[].id  del pago
         * @param {Object} response
         * @param {Number} response.code
         * @param {Array} response.info
        */
        function cobranzaIdentificada(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;

            var payments = data.pagos || [];
            if (payments.length == 0) {
                response.code = 303;
                response.info.push("No se encontraron pagos a regitrar en la petición");
                return;
            }
            var preferences = conautoPreferences.get();
            var folios = [];
            var pagosId = [];
            var pagosString = [];
            var mandatoryFields = ["referenciaCompleta", "fechaCobranza", "fechaPago", "folioCorrecto", "folioIncorrecto", "monto", "aportacion", "gastos", "iva", "seguro_auto", "seguro_vida"];
            var d = new Date();
            var paymentTime = d.getTime();
            log.debug("PaymentTime", paymentTime)
            for (var i = 0; i < payments.length; i++) {
                var payment = payments[i];
                payment.id = [getDateExternalid(payment.fechaPago), payment.referencia, payment.numeroRecibo, parseFloat(payment.monto).toFixed(2), paymentTime, i].join("_");
                payment.idString = [getDateExternalid(payment.fechaPago), payment.referencia, payment.numeroRecibo, parseFloat(payment.monto).toFixed(2)].join("_");
                log.debug("Pago", payment.id)
                checkMandatoryFields(payment, mandatoryFields, response, i + 1);
                checkMandatoryFieldsDate(payment, ["fechaCobranza", "fechaPago"], response, i + 1);
                if (payment.folio) {
                    folios.push(payment.folio + "");
                }
                if (payment.id) {
                    pagosId.push(payment.id + "");
                }
                if (payment.idString) {
                    pagosString.push(payment.idString + "");
                }
            }
            if (response.code == 300) {
                for (var i = 0; i < payments.length; i++) {
                    var payment = payments[i];

                    if (payment.referencia) {
                        var account = preferences.getPreference({
                            key: "CB1P",
                            reference: (payment.referencia || '').substring(0, 2)
                        });
                        if (!account) {
                            response.code = 305;
                            response.info.push("Linea " + (i + 1) + ": Referencia \"" + (payment.referencia || '').substring(0, 2) + "\" no valida");
                        }
                    }
                }
            }
        }


        function createLog(data, response) {
            let logId = null;
            try {
                //Creación del log
                let logRecord = record.create({
                    type: 'customrecord_log_service_conauto'
                });
                //Tipo de Operación
                if (data.tipo) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_type',
                        value: data.tipo
                    });
                }
                //Id Notificación
                if (data.idNotificacion) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_idnot',
                        value: data.idNotificacion
                    });
                }
                //Numero de Pagos recibidos
                if (data.pagos && data.pagos.length > 0) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_length',
                        value: data.pagos.length
                    });
                }
                //Recibido en Netsuite
                logRecord.setValue({
                    fieldId: 'custrecord_log_serv_success',
                    value: true
                });
                //Solicitud
                const dateNow = new Date().getTime();
                let requestFile = file.create({
                    name: 'REQ_' + dateNow + '.json',
                    contents: JSON.stringify(data),
                    fileType: file.Type.JSON,
                    folder: 96285
                });
                let requestFileId = requestFile.save();
                //Respuesta
                let responseFile = file.create({
                    name: 'RES_' + dateNow + '.json',
                    contents: JSON.stringify(response),
                    fileType: file.Type.JSON,
                    folder: 96286
                });
                let responseFileId = responseFile.save();
                if (requestFileId && responseFileId) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_request',
                        value: requestFileId
                    });
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_response',
                        value: responseFileId
                    });
                }
                //Guardar Log
                logId = logRecord.save();
            } catch (e) {
                response.code = 500;
                response.info.push('ERROR CREATE LOG REQUEST: ' + e.message.toString());
                handlerErrorLogRequest('ERROR CREATE LOG REQUEST: ' + e.message.toString(), logId);
            }
            return logId;
        }

        function checkMandatoryFields(data, mandatoryFields, response, line) {
            for (let mandatoryField of mandatoryFields) {
                let value = data[mandatoryField];
                if (!(value || parseFloat(value) === 0 || util.isBoolean(value))) {
                    response.code = 302;
                    response.info.push((line ? ('LÍNEA ' + line + ': ') : '') + 'EL CAMPO ' + mandatoryField + ' NO DEBE ESTAR VACÍO');
                }
            }
        }

        function checkMandatoryFieldsDate(data, mandatoryFields, response, line) {
            for (let mandatoryField of mandatoryFields) {
                let value = data[mandatoryField] || '';
                if (!validarFecha(value) && value) {
                    response.code = 310;
                    response.info.push((line ? ('LÍNEA ' + line + ': ') : '') + 'EL CAMPO ' + mandatoryField + ' NO TIENE UN FORMATO DE FECHA VÁLIDO: DD/MM/YYYY');
                }
            }
        }

        function validarFecha(fecha) {
            // Utilizamos una expresión regular para verificar el formato DD/MM/YYYY
            let patronFecha = /^\d{2}\/\d{2}\/\d{4}$/;
            let estado = true;

            if (patronFecha.test(fecha)) {
                // Verificamos que el día, mes y año sean válidos
                let dia = parseInt(fecha.substring(0, 2), 10);
                let mes = parseInt(fecha.substring(3, 5), 10);
                let anio = parseInt(fecha.substring(6), 10);

                if (mes < 1 || mes > 12) {
                    estado = false;
                }

                let diasPorMes = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

                if (anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0)) {
                    diasPorMes[2] = 29; // Si es año bisiesto, febrero tiene 29 días
                }

                if (dia < 1 || dia > diasPorMes[mes]) {
                    estado = false;
                }

                estado = true;
            } else {
                estado = false;
            }

            return estado;
        }

        function searchRecordNetsuite(type, ids, field, operator, filters) {
            var idsNetsuite = [];
            var result = {
                differences: false,
                ids: []
            }
            filters = filters || [];
            filters.push(search.createFilter({
                name: field,
                operator: operator ? operator : search.main().Operator.ANYOF,
                values: ids
            }));
            search.searchAllRecords({
                type: type,
                filters: filters,
                columns: [
                    search.createColumn({
                        name: field
                    })
                ],
                data: idsNetsuite,
                callback: function (result, idsNetsuite) {
                    var id = result.getValue({
                        name: field
                    });
                    idsNetsuite.push(id + "");
                }
            });
            log.error({
                title: "idsNetsuite " + type,
                details: JSON.stringify(idsNetsuite)
            })
            log.error({
                title: "ids " + type,
                details: JSON.stringify(ids)
            })
            if (idsNetsuite.length != ids.length) {
                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i];
                    log.error({
                        title: "idsNetsuite.indexOf(id)",
                        details: idsNetsuite.indexOf(id)
                    })
                    if (idsNetsuite.indexOf(id) == -1) {
                        result.differences = true;
                        result.ids.push(id);
                    }
                }
            }
            log.error({
                title: "",
                details: JSON.stringify(result)
            })
            return result;
        }

        function pagosSearch(externalId) {
            var idsNetsuite = [];
            var result = {
                differences: false,
                ids: []
            }
            var customrecord_imr_pagos_amortizacionSearchObj = search.create({
                type: "customrecord_imr_pagos_amortizacion",
                filters:
                    [
                        ["externalidstring", "contains", externalId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "ID" }),

                    ]
            });
            var searchResultCount = customrecord_imr_pagos_amortizacionSearchObj.runPaged().count;
            log.debug("customrecord_imr_pagos_amortizacionSearchObj result count", searchResultCount);
            if (searchResultCount > 0) {
                customrecord_imr_pagos_amortizacionSearchObj.run().each(function (result) {
                    var id = result.getValue({ name: 'internalid' });
                    idsNetsuite.push(id + "");
                    return true;
                });

            }
            if (idsNetsuite.length > 1) {
                for (var i = 0; i < idsNetsuite.length; i++) {
                    var id = externalId;
                    log.error({
                        title: "idsNetsuite.indexOf(id)",
                        details: idsNetsuite.indexOf(id)
                    })
                    if (idsNetsuite.indexOf(id) == -1) {
                        result.differences = true;
                        result.ids.push(id);
                    }
                }
            }
            return result;

        }

        function recordFind(recordType, operator, field, value) {
            let id = null;
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
            return id;
        }

        function getDateExternalid(value) {
            let date = stringToDateConauto(value);
            if (date) {
                return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
            } else {
                return "";
            }
        }

        function stringToDateConauto(value) {
            if (value) {
                let arrayDate = value.split("/");
                return new Date(arrayDate[2], arrayDate[1] - 1, arrayDate[0]);
            } else {
                return null;
            }
        }

        function handlerErrorLogRequest(e, logId) {
            if (logId) {
                log.error({
                    title: 'ERRORHANDLER',
                    details: 'LOG ID: ' + logId + ', ' + e
                });
                record.submitFields({
                    type: 'customrecord_log_service_conauto',
                    id: logId,
                    values: {
                        custrecord_log_serv_processed: true,
                        custrecord_log_serv_error: e
                    }
                })
            }
            return logId;
        }

        function successRequest(response) {
            if (response.code == 300) {
                response.code = 200;
                response.info.push('Petición Exitosa');
            }
        }

        return { post: postRequest }

    });