/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(["N/record", "N/search"], /**
 * @param{record} record
 */ (record, search) => {
  let response = {
    code: 200,
    message: "",
    result: [],
  };

  /**
   * Defines the function that is executed when a GET request is sent to a RESTlet.
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
   *     content types)
   * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
   *     Object when request Content-Type is 'application/json' or 'application/xml'
   * @since 2015.2
   */
  const get = (req) => {

let array_solloc=[]

    var customrecord_conauto_sol_localizadoresSearchObj = search.create({
        type: "customrecord_conauto_sol_localizadores",
        filters:
        [
           ["custrecord_conauto_sol_loc_proveedor","anyof",req.id]
        ],
        columns:
        [
            search_id= search.createColumn({
              name: "id",
              sort: search.Sort.ASC,
              label: "ID"
           }),
           /* search_id=search.createColumn({name: "scriptid", label: "ID de script"}), */
           search_estado=search.createColumn({name: "custrecord_conauto_sol_loc_estado", label: "Estado"}),
           search_folio=search.createColumn({name: "custrecord_conauto_sol_loc_folio", label: "Folio"}),
           search_unidad=search.createColumn({name: "custrecord_conauto_sol_loc_unidad", label: "Unidad/Catalogo"}),
           search_descunidad=search.createColumn({name: "custrecord_conauto_sol_loc_unidad_desc", label: "Descripción Unidad"}),
           search_unitinterior=search.createColumn({name: "custrecord_conauto_sol_loc_unidad_anteri", label: "Unidad Anterior"}),
           search_responsable=search.createColumn({name: "custrecord_conauto_sol_loc_responsable", label: "Responsable"}),
           search_installdate=search.createColumn({name: "custrecord_conauto_sol_loc_fecha_inst", label: "Fecha de Instalación"}),
           search_unisntalldate=search.createColumn({name: "custrecord_conauto_sol_loc_fecha_desinst", label: "Fecha de Desinstalación"})
        ]
     });
     var searchResultCount = customrecord_conauto_sol_localizadoresSearchObj.runPaged().count;
     log.debug("customrecord_conauto_sol_localizadoresSearchObj result count",searchResultCount);
     customrecord_conauto_sol_localizadoresSearchObj.run().each(function(result){
        array_solloc.push({
            search_id:result.getValue(search_id),
            search_estado:result.getValue(search_estado),
            search_folio:result.getValue(search_folio),
            search_unidad:result.getValue(search_unidad),
            search_descunidad:result.getValue(search_descunidad),
            search_unitinterior:result.getValue(search_unitinterior),
            search_responsable:result.getValue(search_responsable),
            search_installdate:result.getValue(search_installdate),
            search_unisntalldate:result.getValue(search_unisntalldate)
        })
        return true;
     });
    


     return array_solloc


  };

  /**
   * Defines the function that is executed when a PUT request is sent to a RESTlet.
   * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
   *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
   *     the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
   *     Object when request Content-Type is 'application/json' or 'application/xml'
   * @since 2015.2
   */
  const put = (req) => {
   

  };

  /**
   * Defines the function that is executed when a POST request is sent to a RESTlet.
   * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
   *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
   *     the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
   *     Object when request Content-Type is 'application/json' or 'application/xml'
   * @since 2015.2
   */
  const post = (req) => {
  };

  /**
   * Defines the function that is executed when a DELETE request is sent to a RESTlet.
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
   *     content types)
   * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
   *     Object when request Content-Type is 'application/json' or 'application/xml'
   * @since 2015.2
   */
  const doDelete = (requestParams) => {};

  //Function area
  function formatingdate(trandate) {
    let formating = trandate.split("/");
    let newdate1 = formating[1] + "/" + formating[0] + "/" + formating[2];
    let newdate = new Date(newdate1);
    return newdate;
  }

  function getLocalizador(localizador) {
    let localizadorid;
    log.debug("Entra al funlocalizador", localizador);
    try {
      let customerSearchObj = search.create({
        type: "customlist_conauto_n_localizador",
        filters: [["name", "is", localizador]],
        columns: [
          (search_id = search.createColumn({
            name: "internalid",
            label: "Internal ID",
          })),
        ],
      });

      var searchResultCount = customerSearchObj.runPaged().count;

      log.debug("searchResultCount", searchResultCount);

      customerSearchObj.run().each(function (result) {
        localizadorid = result.getValue(search_id);
        return true;
      });
    } catch (error) {
      localizadorid = false;
      log.debug("Error al traer clienteId ", error.message);
      return localizadorid;
    }
    return localizadorid;
  }

  function getCostumer(nombrecliente) {
    let entityId;
    try {
      let customerSearchObj = search.create({
        type: "customer",
        filters: [["name", "is", nombrecliente]],
        columns: [
          (search_id = search.createColumn({
            name: "internalid",
            label: "Internal ID",
          })),
        ],
      });

      var searchResultCount = customerSearchObj.runPaged().count;

      customerSearchObj.run().each(function (result) {
        entityId = result.getValue(search_id);
        return true;
      });
    } catch (error) {
      accountId = false;
      log.debug("Error al traer clienteId ", error.message);
      return entityId;
    }
    return entityId;
  }
  function getGroup(numberGroup) {
    let groupId;
    try {
      let customerSearchObj = search.create({
        type: "customrecord_cseg_grupo_conauto",
        filters: [["name", "is", numberGroup]],
        columns: [
          (search_id = search.createColumn({
            name: "internalid",
            label: "Internal ID",
          })),
        ],
      });

      var searchResultCount = customerSearchObj.runPaged().count;

      customerSearchObj.run().each(function (result) {
        groupId = result.getValue(search_id);
        return true;
      });
    } catch (error) {
      groupId = false;
      log.debug("Error al traer Grupos ", error.message);
      return groupId;
    }
    return groupId;
  }
  function getFolio(numberFolio) {
    let folioId;
    try {
      let customerSearchObj = search.create({
        type: "customlist_conauto_n_localizador",
        filters: [["name", "is", numberFolio]],
        columns: [
          (search_id = search.createColumn({
            name: "internalid",
            label: "Internal ID",
          })),
        ],
      });

      var searchResultCount = customerSearchObj.runPaged().count;

      customerSearchObj.run().each(function (result) {
        folioId = result.getValue(search_id);
        return true;
      });

    } catch (error) {
      folioId = false;
      log.debug("Error al traer Grupos ", error.message);
      return folioId;
    }
    return folioId;
  }

  return { get, put, post, delete: doDelete };
});
