/**
 *@NApiVersion 2.1
 *@author Erick Estrada
 *@NScriptType MapReduceScript
 */
define(["N/record", 'N/file', 'N/runtime', 'N/search'], (record, file, runtime, search) => {

    const methods = {};
    methods.getInputData = () => {
        let values = [];
        let sFilters = [];
        let infoData = {};
        let customersData = file.load({
            id: "SuiteScripts/Netsuite-Conauto/lib/Base para actualizar en NS.csv"
        })

        let iterator = customersData.lines.iterator();
        iterator.each(function () { return false; });
        iterator.each(function (line) {
            let values = line.value.split(",");
            sFilters.push(["vatregnumber", search.Operator.IS, values[0]], "OR")
            infoData[values[0]] = {
                "RFC": values[0],
                "RAZON SOCIAL": values[1],
                "CODIGO POSTAL": values[2],
                "REGIMEN FISCAL": values[3]
            }
            return true;
        });
        sFilters.pop();

        let customersSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: sFilters,
            columns: [
                search.createColumn({ name: "vatregnumber", label: "Tax Number" }),
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
                let rfc = result.getValue('vatregnumber');
                values.push({ "ID": result.getValue('internalid'), ...infoData[rfc] })
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
                    key: customer.RFC,
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
            let customerJSON = JSON.parse(customer)
            record.submitFields({
                type: record.Type.CUSTOMER,
                id: customerJSON.ID,
                values: {
                    custentity_fe_residencia_fiscal: customerJSON["CODIGO POSTAL"],
                    custentity_razon_social: customerJSON["RAZON SOCIAL"],
                    custentity_imr_fe40_regimenfiscal: customerJSON["REGIMEN FISCAL"]
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
        }
        log.debug({
            title: "DATOS",
            details: context
        })
    }

    methods.summarize = (summary) => {

    }

    return methods
});
