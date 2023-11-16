# CONAUTO

Scripts utilizados por CONAUTO en NetSuite

# Servicios actuales

- **PrimerasCuotas**

  - | Campo                    | Tipo                   |
    | ------------------------ | ---------------------- |
    | Tipo                     | String                 |
    | idNotificacion           | String                 |
    | pagos                    | Array[Object]          |
    | pagos.folio              | String                 |
    | pagos.referencia         | String                 |
    | pagos.referenciaCompleta | String                 |
    | pagos.fechaCobranza      | Date Format DD/MM/YYYY |
    | pagos.fechaPago          | Date Format DD/MM/YYYY |
    | pagos.monto              | Number                 |
    | pagos.formaPago          | String                 |
    | pagos.numPago            | Number                 |
  - ```json
    Ejemplo JSON
    {
        "tipo": "PrimerasCuotas",
        "idNotificacion": "150",
        "pagos": [
            {
                "folio": "11199991234",
                "referencia": "RB",
                "referenciaCompleta": "RB23082023",
                "fechaCobranza": "23/08/2023",
                "fechaPago": "23/08/2023",
                "monto": 220.00,
                "formaPago": "01",
                "numPago": 151
            }
        ]
    }
    ```

- **SolicitudPago**

  - | Campo                        | Tipo          |
    | ---------------------------- | ------------- |
    | tipo                         | String        |
    | idNotificacion               | String        |
    | detalles                     | Array[Object] |
    | detalles.tipoMovimiento      | Number        |
    | detalles.monto               | Number        |
    | detalles.cuentaBancaria      | String        |
    | detalles.referencia          | String        |
    | detalles.beneficiario        | Object        |
    | detalles.beneficiario.nombre | String        |
    | detalles.beneficiario.rfc    | String        |

  - ```json
    Ejemplo JSON
    {
        "tipo": "SolicitudPago",
        "idNotificacion": "5621",
        "detalles": [
            {
                "tipoMovimiento": 1,
                "monto": 30,
                "folio": "1105042",
                "cuentaBancaria": "1234569878",
                "referencia": "",
                "beneficiario": {
                    "nombre": "Samuel Zavala Sanchez",
                    "rfc": "ZASS95020501"
                }
            }
        ]
    }
    ```

- **PolizaIntegrantes**

  - | Campo          | Tipo                   |
    | -------------- | ---------------------- |
    | tipo           | String                 |
    | idNotificacion | String                 |
    | totalPagado    | Number                 |
    | fecha          | Date Format DD/MM/YYYY |

  - ```json
    Ejemplo JSON
    {
        "tipo": "PolizaIntegrantes",
        "idNotificacion": "3",
        "totalPagado": 2530,
        "fecha": "01/03/2023"
    }
    ```

- **ActualizaContrato**

  - | Campo                       | Tipo                   |
    | --------------------------- | ---------------------- |
    | tipo                        | String                 |
    | idNotificacion              | String                 |
    | folio                       | String                 |
    | bid                         | Number                 |
    | distribuidora               | String                 |
    | catalogoAuto                | String                 |
    | descripcionAuto             | String                 |
    | precio                      | Number                 |
    | lista                       | Number                 |
    | fechaContrato               | Date Format DD/MM/YYYY |
    | uso                         | String                 |
    | rfcVendedor                 | String                 |
    | vendedor                    | String                 |
    | fechaRecepcion              | Date Format DD/MM/YYYY |
    | beneficiario                | String                 |
    | tipoPago                    | String                 |
    | pagoCon                     | String                 |
    | pagoBoleta                  | String                 |
    | pda                         | Number                 |
    | fechaPago                   | Date Format DD/MM/YYYY |
    | importe                     | Number                 |
    | banco                       | String                 |
    | totalPagado                 | Number                 |
    | integrante                  | String                 |
    | cliente                     | Object                 |
    | cliente.esPersona           | Boolean                |
    | cliente.sexo                | Boolean                |
    | cliente.fechaNacimiento     | Date Format DD/MM/YYYY |
    | cliente.curp                | String                 |
    | cliente.estadoCivil         | String                 |
    | cliente.telefono            | String                 |
    | cliente.telefonoCasa        | String                 |
    | cliente.celular             | String                 |
    | cliente.correo              | String                 |
    | cliente.nombre              | String                 |
    | cliente.apellidoPaterno     | String                 |
    | cliente.apellidoMaterno     | String                 |
    | cliente.rfc                 | String                 |
    | cliente.rf-clave            | String                 |
    | cliente.razon               | String                 |
    | cliente.usoCfdi             | String                 |
    | cliente.direccion           | Object                 |
    | cliente.direccion.calle     | String                 |
    | cliente.direccion.numero    | String                 |
    | cliente.direccion.colonia   | String                 |
    | cliente.direccion.ciudad    | String                 |
    | cliente.direccion.estado    | String                 |
    | cliente.direccion.cp        | String                 |
    | cliente.direccion.municipio | String                 |
    | grupo                       | Object                 |
    | grupo.id                    | String                 |
    | grupo.nombre                | String                 |
    | grupo.tipo                  | String                 |
    | grupo.clavePlan             | String                 |
    | grupo.descripcionPlan       | String                 |
    | grupo.factorIntegrante      | Number                 |
    | grupo.factorAdjudicado      | Number                 |
    | grupo.plazo                 | Number                 |
    | grupo.inicioVigencia        | Date Format DD/MM/YYYY |
    | grupo.finVigencia           | Date Format DD/MM/YYYY |
    | grupo.clavePromocion        | String                 |
    | grupo.descripcionPromocion  | String                 |

  - ```json
    Ejemplo JSON
    {
        "idNotificacion": "36145",
        "tipo": "ActualizaContrato",
        "folio": "11199991234",
        "bid": 823,
        "distribuidora": "MYLSA VALLEJO, S.A. DE C.V.",
        "catalogoAuto": "CF260",
        "descripcionAuto": "CUOTA FIJA 260",
        "precio": 260000,
        "lista": 539,
        "fechaContrato": "06/06/2023",
        "uso": "Particular",
        "rfcVendedor": "COGG810330092021",
        "vendedor": "GRECIA MARIA CONSTANDCE GUTIERREZ",
        "fechaRecepcion": "16/06/2023",
        "beneficiario": "LILIA FLORES LEYVA",
        "tipoPago": "Depósito Bancario ",
        "pagoCon": "1",
        "pagoBoleta": "0",
        "pda": 1,
        "fechaPago": "06/06/2023",
        "importe": 9275.71,
        "banco": "53",
        "totalPagado": 9275.71,
        "integrante": "11",
        "cliente": {
            "esPersona": true,
            "sexo": true,
            "fechaNacimiento": "25/06/1953",
            "curp": "BARG530625HDFRYL04",
            "estadoCivil": "Casado",
            "telefono": "5557534629",
            "telefonoCasa": "5554700623",
            "celular": "5554700623",
            "correo": "gh2005max@gmail.com",
            "nombre": "GUILLERMO",
            "apellidoPaterno": "BARONA",
            "apellidoMaterno": "",
            "rfc": "BARG530625AQ7",
            "rf-clave": "605",
            "razon": "GUILLERMO BARONA REYES",
            "usoCfdi": "P01",
            "direccion": {
                "calle": "NORTE 64",
                "numero": "",
                "colonia": "SALVADOR DIAZ MIRON",
                "ciudad": "CIUDAD DE MEXICO",
                "estado": "CIUDAD DE MEXICO",
                "cp": "7400",
                "municipio": "GUSTAVO A MADERO"
            }
        },
        "grupo": {
            "id": "5782",
            "nombre": "5782",
            "tipo": "CLASICO",
            "clavePlan": "D428",
            "descripcionPlan": "PLAN CUOTA FIJA BASIC 60M S/A",
            "factorIntegrante": 0.45,
            "factorAdjudicado": 0.45,
            "plazo": 60,
            "inicioVigencia": "02/06/2023",
            "finVigencia": "31/08/2023",
            "clavePromocion": "",
            "descripcionPromocion": ""
        }
    }
    ```

- **PagoUnidad**

  - | Campo             | Tipo   |
    | ----------------- | ------ |
    | tipo              | String |
    | idNotificacion    | String |
    | folio             | String |
    | folioFactura      | String |
    | factura           | Number |
    | cartaCredito      | Number |
    | diferenciaCCVF    | Number |
    | bid               | Number |
    | vehiculoEnt       | String |
    | totalPagar        | Number |
    | descripcionVehEnt | String |
    | domiciliado       | String |
    | marcaVehiculo     | String |
    | linea             | String |
    | añoModelo         | Number |
    | referencia        | String |

  - ```json
    Ejemplo JSON
    {
        "tipo": "PagoUnidad",
        "idNotificacion": "35821",
        "folio": "1079597",
        "folioFactura": "ABMZ000000917",
        "factura": 284500,
        "cartaCredito": 270000,
        "diferenciaCCVF": 0,
        "bid": 72,
        "vehiculoEnt": "CHAALSM85",
        "totalPagar": 270000,
        "descripcionVehEnt": "CUOTA FIJA 270",
        "domiciliado": "",
        "marcaVehiculo": "FORD",
        "linea": "",
        "añoModelo": 0,
        "referencia": ""
    }
    ```

- **InteresesMoratorios**

  - | Campo          | Tipo                   |
    | -------------- | ---------------------- |
    | tipo           | String                 |
    | idNotificacion | String                 |
    | fecha          | Date Format DD/MM/YYYY |
    | monto          | Number                 |

  - ```json
    Ejemplo JSON
    {
        "tipo": "InteresesMoratorios",
        "idNotificacion": "95849",
        "fecha": "13/08/2023",
        "monto": 1649.53
    }
    ```

- **ReservaPasivo**

  - | Campo          | Tipo                   |
    | -------------- | ---------------------- |
    | tipo           | String                 |
    | idNotificacion | String                 |
    | fecha          | Date Format DD/MM/YYYY |
    | monto          | Number                 |

  - ```json
    Ejemplo JSON
    {
        "tipo": "ReservaPasivo",
        "idNotificacion": "95843",
        "fecha": "11/12/2023",
        "monto": 2735.34
    }
    ```

- **Bajas**

  - | Campo             | Tipo   |
    | ----------------- | ------ |
    | tipo              | String |
    | idNotificacion    | String |
    | folio             | String |
    | mes               | String |
    | estatus           | Number |
    | tipoPago          | Number |
    | montoPenalizacion | Number |
    | montoPagar        | Number |

  - ```json
    Ejemplo JSON
    {
        "tipo": "Bajas",
        "idNotificacion": "95844",
        "folio": "1105041",
        "mes": "5",
        "estatus": 1,
        "tipoPago": 1,
        "montoPenalizacion": 3000,
        "montoPagar": 1000
    }
    ```

- **ModificacionBajas**

  - | Campo          | Tipo   |
    | -------------- | ------ |
    | tipo           | String |
    | idNotificacion | String |
    | folio          | String |
    | estado         | String |
    | saldoADevolver | Number |
    | penalizacion   | Number |

  - ```json
    Ejemplo JSON
    {
        "tipo": "ModificacionBajas",
        "idNotificacion": "95844",
        "folio": "1105041",
        "estado": "",
        "saldoADevolver": 200,
        "penalizacion": 1000
    }
    ```

- **ComplementoBajas**

  - | Campo                  | Tipo   |
    | ---------------------- | ------ |
    | tipo                   | String |
    | idNotificacion         | String |
    | folio                  | String |
    | saldoADevolver         | Number |
    | originalSaldoADevolver | Number |
    | originalPenalizacion   | String |
    | tipoComplemento        | String |
    | penalizacion           | Number |
    | estado                 | Number |

  - ```json
    Ejemplo JSON
    {
      "tipo": "ComplementoBajas",
      "idNotificacion": "95843",
      "folio": "1105041",
      "saldoADevolver": 15124,
      "originalSaldoADevolver": 12312,
      "originalPenalizacion": 213482.21,
      "tipoComplemento": "1",
      "penalizacion": 30000,
      "estado": 6
    }
    ```

- **AplicacionCobranza**

  - | Campo               | Tipo                   |
    | ------------------- | ---------------------- |
    | tipo                | String                 |
    | idNotificacion      | Number                 |
    | pagos               | Array[Object]          |
    | pagos.referencia    | String                 |
    | pagos.fechaCobranza | Date Format DD/MM/YYYY |
    | pagos.fechaPago     | Date Format DD/MM/YYYY |
    | pagos.folio         | String                 |
    | pagos.status        | Number                 |
    | pagos.monto         | Number                 |
    | pagos.formaPago     | String                 |
    | pagos.numPago       | Number                 |
    | pagos.grupo         | String                 |
    | pagos.integrante    | String                 |
    | pagos.cliente       | String                 |
    | pagos.aportacion    | Number                 |
    | pagos.gastos        | Number                 |
    | pagos.iva           | Number                 |
    | pagos.seguro_auto   | Number                 |
    | pagos.seguro_vida   | Number                 |
    | pagos.total_pagar   | Number                 |

  - ```json
    Ejemplo JSON
    {
        "tipo": "AplicacionCobranza",
        "idNotificacion": 30990,
        "pagos": [
            {
                "referencia": "RA26022030",
                "fechaCobranza": "19/09/2023",
                "fechaPago": "19/09/2023",
                "folio": "1147170",
                "status": 4,
                "monto": 4700,
                "formaPago": "03",
                "numPago": 6,
                "grupo": "5767",
                "integrante": "7",
                "cliente": "ALBERTO SALVADOR DE LA TORRE TRUJILL",
                "aportacion": 1599.72,
                "gastos": 680,
                "iva": 108.80,
                "seguro_auto": 2148.44,
                "seguro_vida": 163.04,
                "total_pagar": 4700
            }
        ]
    }
    ```

- **ProvisionCartera**

  - | Campo               | Tipo                   |
    | ------------------- | ---------------------- |
    | tipo                | String                 |
    | idNotificacion      | Number                 |
    | pagos               | Array[Object]          |
    | pagos.fecha         | Date Format DD/MM/YYYY |
    | pagos.status        | Number                 |
    | pagos.folioContrato | String                 |
    | pagos.grupo         | String                 |
    | pagos.integrante    | Number                 |
    | pagos.total_pagar   | Number                 |
    | pagos.cliente       | String                 |
    | pagos.aportacion    | Number                 |
    | pagos.gastos        | Number                 |
    | pagos.iva           | Number                 |
    | pagos.seguro_auto   | Number                 |
    | pagos.seguro_vida   | Number                 |

  - ```json
    Ejemplo JSON
    {
        "tipo": "ProvisionCartera",
        "idNotificacion": 123,
        "pagos": [
            {
                "fecha": "26/01/2023",
                "status": 1,
                "folioContrato": "1145601",
                "grupo": "5753",
                "integrante": 3,
                "total_pagar": 1263239.68,
                "cliente": "231",
                "aportacion": 836400.00,
                "gastos": 224400.00,
                "iva": 35904.00,
                "seguro_auto": 105861.28,
                "seguro_vida": 60674.40
            }
        ]
    }
    ```

- **CambiarEstatus**

  - | Campo          | Tipo   |
    | -------------- | ------ |
    | tipo           | String |
    | idNotificacion | String |
    | folio          | String |
    | estatus        | Number |
    | subestatus     | String |

  - ```json
    Ejemplo JSON
    {
        "tipo": "CambiarEstatus",
        "idNotificacion": "47265",
        "folio": "1105041",
        "estatus": 5,
        "subestatus": "1"
    }
    ```

- **ReclasificacionPrimeraCuota**

  - | Campo             | Tipo                   |
    | ----------------- | ---------------------- |
    | tipo              | String                 |
    | idNotificacion    | String                 |
    | pagos             | Array[Object]          |
    | pagos.folio       | String                 |
    | pagos.referencia  | String                 |
    | pagos.fecha       | Date Format DD/MM/YYYY |
    | pagos.monto       | Number                 |
    | pagos.grupo       | String                 |
    | pagos.cliente     | String                 |
    | pagos.formaPago   | String                 |
    | pagos.importe     | Number                 |
    | pagos.totalPagado | Number                 |
    | pagos.aportacion  | Number                 |
    | pagos.gastos      | Number                 |
    | pagos.iva         | Number                 |
    | pagos.seguro_auto | Number                 |
    | pagos.seguro_vida | Number                 |

  - ```json
    Ejemplo JSON
    {
    "tipo": "ReclasificacionPrimeraCuota",
    "idNotificacion": "189",
    "pagos": [
          {
            "folio": "1148590",
            "referencia": "RB23082023",
            "fecha": "23/08/2023",
            "monto": 220,
            "grupo": "5460",
            "cliente": "50",
            "formaPago": "01",
            "importe": 5071.92,
            "totalPagado": 5071.92,
            "aportacion": 2829.57,
            "gastos": 868,
            "iva": 138.88,
            "seguro_auto": 197.96,
            "seguro_vida": 1037.51
          }
        ]
    }
    ```
