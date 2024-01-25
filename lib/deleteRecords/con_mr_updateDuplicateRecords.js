/**
 *@NApiVersion 2.1
 *@author Erick Estrada
 *@NScriptType MapReduceScript
 */
define(["N/record", 'N/file', 'N/runtime', 'N/search'], (record, file, runtime, search) => {

    const methods = {};
    const getCFDIs = () => {
        try {
            let cfdis = {};
            search.create({
                type: "customrecord_uso_cfdi_fe_33",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            label: "ID"
                        }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            }).run().each(function (result) {
                cfdis[result.getValue("name")] = result.getValue("internalid")
                return true;
            })
            return cfdis;
        } catch (err) {
            log.error("Errror", err)
        }
    }
    methods.getInputData = () => {
        let values = [];
        let sFilters = [];
        let infoData = {};
        let customersData = file.load({
            id: "SuiteScripts/Netsuite-Conauto/lib/Actualizacion 230124.csv"
        })

        let listCfdis = getCFDIs();

        let iterator = customersData.lines.iterator();
        iterator.each(function () { return false; });
        iterator.each(function (line) {
            let values = line.value.split(",");
            let fullName = `${values[3]} ${values[4]} ${values[5]}`;
            sFilters.push([["firstname", search.Operator.CONTAINS, `${values[3]}`], "AND", ["lastname", search.Operator.CONTAINS, `${values[4]} ${values[5]}`]],
                "OR")
            infoData[fullName] = {
                "NOMBRE COMPLETO": fullName,
                "RFC": values[2],
                "CODIGO POSTAL": values[7],
                "REGIMEN FISCAL": values[6],
                "USO CFDI": listCfdis[values[16]],
                "DIRECCION": {
                    "ADDR1": `${values[8]} ${values[9]} ${values[10]}`,
                    "ADDR2": `${values[11]}, ${values[12]}`,
                    "CIUDAD": `${values[13]}`
                }
            }
            return true;
        });
        sFilters.pop();

        let customersSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: sFilters,
            columns: [
                search.createColumn({ name: "firstname", label: "Nombre" }),
                search.createColumn({ name: "lastname", label: "Apellido" }),
                search.createColumn({ name: "internalid", label: "Internal ID" })]
        })
        let searchResultCount = customersSearch.runPaged().count;
        log.debug("TOTAL", searchResultCount);
        let turns = Math.ceil(searchResultCount / 1000)
        let startLimit = 0;
        let endLimit = 1000;
        for (let turn = 1; turn <= turns; turn++) {
            let resultsCustomers = customersSearch.run().getRange({
                start: startLimit,
                end: endLimit
            })
            for (const result of resultsCustomers) {
                let fullName = `${result.getValue('firstname')} ${result.getValue("lastname")}`;
                values.push({ "ID": result.getValue('internalid'), ...infoData[fullName] })
            }

            startLimit += turn == 1 ? 1001 : 1000;
            endLimit += 1000;
        }


        return { values: values };
    }

    methods.map = (context) => {
        let customers = JSON.parse(context.value);

        try {
            for (const customer of customers) {
                context.write({
                    key: customer["NOMBRE COMPLETO"],
                    value: customer,
                });
            }
        } catch (error) {
            log.error("Error", error);
            handlerError(error);
        }
    }

    methods.reduce = (context) => {
        let customers = context.values;
        for (const customer of customers) {
            try {
                let customerJSON = JSON.parse(customer)
                log.debug({
                    title: "DATOS",
                    details: customerJSON
                });
                let customerObj = record.load({
                    type: record.Type.CUSTOMER,
                    id: customerJSON.ID,
                    isDynamic: true,
                    options: {
                        ignoreMandatoryFields: true
                    }
                });
                customerObj.setValue({
                    fieldId: "custentity_fe_residencia_fiscal",
                    value: customerJSON["CODIGO POSTAL"]
                });
                customerObj.setValue({
                    fieldId: "custentity_imr_fe40_regimenfiscal",
                    value: customerJSON["REGIMEN FISCAL"]
                });
                customerObj.setValue({
                    fieldId: "custentity_uso_cfdi",
                    value: customerJSON["USO CFDI"]
                });

                let countLine = customerObj.getLineCount({
                    sublistId: 'addressbook'
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
                    value: customerJSON["DIRECCION"]["ADDR1"]
                });
                addressObj.setValue({
                    fieldId: 'addr2',
                    value: customerJSON["DIRECCION"]["ADDR2"]
                });
                addressObj.setValue({
                    fieldId: 'city',
                    value: customerJSON["DIRECCION"]["CIUDAD"]
                });
                addressObj.setValue({
                    fieldId: 'zip',
                    value: customerJSON["CODIGO POSTAL"]
                });
                customerObj.commitLine({
                    sublistId: 'addressbook'
                });

                let customerSave = customerObj.save();
            } catch (error) {
                log.error("No se logro actualizar el cliente", error)
            }
        }

    }

    methods.summarize = (summary) => {

    }

    return methods
});
