/**
 *@NApiVersion 2.1
 *@author Erick Estrada
 *@NScriptType MapReduceScript
 */
define(["N/record", 'N/file', 'N/runtime', 'N/search'], (record, file, runtime, search) => {

    const methods = {};
    const getCFDIs = () => {
        try {
            let customers = [];
            let cfdis = {};
            search.create({
                type: "customrecord_cseg_folio_conauto",
                filters:
                    [
                        "externalid", "anyof", "1148568",
                        "1149216",
                        "1137644",
                        "1140585",
                        "1146853",
                        "1147149",
                        "1148210",
                        "1147811",
                        "1148583",
                        "1148968",
                        "1147601",
                        "1149061",
                        "1148760",
                        "1149343",
                        "1149262",
                        "1149398",
                        "1149353",
                        "1149528",
                        "1149509",
                        "1149281",
                        "1149500",
                        "1149537",
                        "1149211",
                        "1142637",
                        "1147640",
                        "1146853",
                        "6068961",
                        "1149898",
                        "1149901",
                        "1149242",
                        "6068958",
                        "6068953",
                        "1148871",
                        "6068959",
                        "1149606",
                        "1149064",
                        "1148707",
                        "1149068",
                        "1149785",
                        "1148775",
                        "6068964",
                        "1149572",
                        "1147509",
                        "1147513",
                        "1147580",
                        "1149661",
                        "1149793",
                        "1149834",
                        "1149838",
                        "1149851",
                        "1149869",
                        "1149871",
                        "1149872",
                        "1149876",
                        "1149902",
                        "1149903",
                        "1149916",
                        "1149926",
                        "1149927",
                        "1149935",
                        "1149937",
                        "1149938",
                        "1149940",
                        "1149942",
                        "1149943",
                        "1149944",
                        "1149945",
                        "1149946",
                        "1149947",
                        "1149948",
                        "1149954",
                        "1149987",
                        "1149989",
                        "1149990",
                        "1149991",
                        "1149992",
                        "1149993",
                        "1149996",
                        "1150007",
                        "1150008",
                        "1150017",
                        "1150018",
                        "1150019",
                        "1150020",
                        "1150033",
                        "1149193",
                        "1149194",
                        "1149217",
                        "1149702",
                        "1149799",
                        "1149813",
                        "1149825",
                        "1149836",
                        "1149839",
                        "1149870",
                        "1149893",
                        "1149933",
                        "1149936",
                        "1149941",
                        "1149951",
                        "1149956",
                        "1149957",
                        "1149958",
                        "1149959",
                        "1149966",
                        "1149988",
                        "1149997",
                        "1149998",
                        "1149875",
                        "1149877",
                        "1149955",
                        "1149978",
                        "1149979",
                        "1149986",
                        "1150004",
                        "1150027"
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_CLIENTE_INTEGRANTE",
                            label: "ID interno"
                        }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            }).run().each(function (result) {
                cfdis[result.getValue({ name: "internalid", label: "Internal ID" })] = result.getValue({
                    name: "internalid",
                    join: "CUSTRECORD_CLIENTE_INTEGRANTE",
                    label: "ID interno"
                })
                customers.push({
                    "customerId": result.getValue({
                        name: "internalid",
                        join: "CUSTRECORD_CLIENTE_INTEGRANTE",
                        label: "ID interno"
                    })
                })
                return true;
            })
            log.audit("customer push", customers)
            return customers;
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

        log.audit("CFDI", listCfdis);

        return { values: listCfdis };
    }

    methods.map = (context) => {
        let request = JSON.parse(context.value);
        // log.audit("map req", request)
        try {
            for (let r in request) {
                // log.audit('Map65 - ', JSON.stringify({ key: r, value: request[r] }));
                context.write({
                    key: r,
                    value: request[r]
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
                record.submitFields({
                    type: "customer",
                    id: customerJSON.customerId,
                    values: {
                        "companyname": ""
                    }
                })
            } catch (error) {
                log.error("No se logro actualizar el cliente", error)
            }
        }

    }

    methods.summarize = (summary) => {

    }

    return methods
});
