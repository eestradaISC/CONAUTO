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

    if (req.idsol) {
      let localizador =[]
      var customrecord_conauto_localizadoresSearchObj = search.create({
        type: "customrecord_conauto_localizadores",
        filters:
        [
           ["custrecord_localizador_solicitud","anyof",req.idsol]
        ],
        columns:
        [
           search_id=search.createColumn({name: "id",label: "ID"}),
           search_idscript=search.createColumn({name: "scriptid", label: "ID de script"}),
           search_isactive=search.createColumn({name: "isinactive", label: "INACTIVO"}),
           search_dateinstall=search.createColumn({name: "custrecord_localizador_anio", label: "FECHA INSTALACIÓN"}),
           search_grade=search.createColumn({name: "custrecord_localizador_morosidad", label: "GRADO DE MOROSIDAD"}),
           search_numloc=search.createColumn({name: "custrecord_localizador_localizador", label: "N DE LOCALIZADOR"}),
           search_name=search.createColumn({name: "custrecord_localizador_nombre", label: "NOMBRE"}),
           search_group=search.createColumn({name: "custrecord_localizador_grupo", label: "GRUPO"}),
           search_serieunit=search.createColumn({name: "custrecord_localizador_serie", label: "No SERIE DE LA UNIDAD"}),
           search_unit=search.createColumn({name: "custrecord_localizador_unidad", label: "UNIDAD"}),
           search_folio=search.createColumn({name: "custrecord_localizador_folio", label: "FOLIO"}),
           search_lastsignal=search.createColumn({name: "custrecord_localizador_ultima_senal", label: "ÚLTIMA SEÑAL"})
        ]
     });
     var searchResultCount = customrecord_conauto_localizadoresSearchObj.runPaged().count;
     log.debug("customrecord_conauto_localizadoresSearchObj result count",searchResultCount);
     customrecord_conauto_localizadoresSearchObj.run().each(function(result){
        
      localizador.push({
        search_id:result.getValue(search_id),
        search_idscript:result.getValue(search_idscript),
        search_isactive:result.getValue(search_isactive),
        search_dateinstall:result.getValue(search_dateinstall),
        search_grade:result.getValue(search_grade),
        search_numloc:result.getText(search_numloc),
        search_name:result.getText(search_name),
        search_group:result.getValue(search_group),
        search_serieunit:result.getValue(search_serieunit),
        search_unit:result.getValue(search_unit),
        search_folio:result.getValue(search_folio),
        search_lastsignal:result.getValue(search_lastsignal)
      })

        return true;
     });

     log.debug( "EN localizador",localizador )

     return localizador

    }else if(req.idloc){
      let objLoc={
        fields:{
          id:'',
          custrecord_localizador_solicitud:'',
          isinactive:'',
          created:'',
          custrecord_localizador_morosidad:'',
          custrecord_localizador_localizador:'',
          custrecord_localizador_serie:'',
          custrecord_localizador_ultima_senal:''
        }
      }
      
      let solicitudlocalizador = record.load({
        type:"customrecord_conauto_localizadores",
        id: req.idloc,
        isDynamic: true,
      });

      objLoc.fields.id= solicitudlocalizador.getText({
        fieldId: "id"
      })
      objLoc.fields.custrecord_localizador_solicitud= solicitudlocalizador.getText({
        fieldId: "custrecord_localizador_solicitud"
      })
      objLoc.fields.isinactive= solicitudlocalizador.getText({
        fieldId: "isinactive"
      })
      objLoc.fields.created= solicitudlocalizador.getText({
        fieldId: "created"
      })
      objLoc.fields.custrecord_localizador_morosidad= solicitudlocalizador.getText({
        fieldId: "custrecord_localizador_morosidad"
      })
      objLoc.fields.custrecord_localizador_localizador= solicitudlocalizador.getText({
        fieldId: "custrecord_localizador_localizador"
      })
      objLoc.fields.custrecord_localizador_serie= solicitudlocalizador.getText({
        fieldId: "custrecord_localizador_serie"
      })
      objLoc.fields.custrecord_localizador_ultima_senal= solicitudlocalizador.getText({
        fieldId: "custrecord_localizador_ultima_senal"
      })
      return objLoc;
    }
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
    log.debug("lO QUE LELGA EL PUT",req)

   let internalid=req.internalid
   let isinactive = req.isinactive==="true"?true:false;
   let anio = formatingdate(req.fechacreacion);
   let morosidad = req.morosidad;

let localizador = getLocalizador(req.localizador,req.internalid);
    if (localizador==false) {
        response.code = 400;
        response.message = "err_localizador"
        return response;
    }
    let serie = getSerie(req.serie,req.internalid)
    if (serie==true) {
      save_serie=req.serie
    }else{
    response.code = 400;
        response.message = "err_serie"
        return response;
    }
   let ultima_senal = req.ultima_senal;

   try {
     let NewLocObj = record.load({
      type: "customrecord_conauto_localizadores",
      id: internalid,
     })
     try {
       NewLocObj.setValue({
         fieldId: "isinactive",
         value: isinactive,
       });
/*        NewLocObj.setValue({
        fieldId: "custrecord_localizador_solicitud",
        value: solicitud,
      }); */

       NewLocObj.setValue({
         fieldId: "custrecord_localizador_anio",
         value: anio,
       });
       NewLocObj.setValue({
         fieldId: "custrecord_localizador_morosidad",
         value: morosidad,
       });
       NewLocObj.setValue({
         fieldId: "custrecord_localizador_localizador",
         value: localizador!="false" ? localizador : "",
       });
      
       NewLocObj.setValue({
         fieldId: "custrecord_localizador_serie",
         value: save_serie,
       });
       NewLocObj.setValue({
         fieldId: "custrecord_localizador_ultima_senal",
         value: ultima_senal,
       });
     } catch (error) {
       log.error("Error al cargar un campo de localizador ", error);
       response.code = 400;
       response.message = error.message;
       return response;
     }
     try {
       let idLocation = NewLocObj.save({
       });
       response.code = 200;
       response.message = "exito"
       response.result.push({idLocation}) 
     } catch (error) {
       log.error("Error al guardar localizador", error);
       response.code = 400;
       response.message = "Error al guardar localizador " + error.message;
       return response;
     }
   } catch (error) {
     log.error("Error al crear localizador", error);
     response.code = 400;
     response.message = "Error al crear localizador " + error.message;
     return response;
   }

   return response;

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
    let isinactive = req.isinactive==="true"?true:false;
    let solicitud = req.solicitud
    let anio = formatingdate(req.fechacreacion);
    let morosidad = req.morosidad;
    let localizador = getLocalizador(req.localizador,0);
    if (localizador==false) {
        response.code = 400;
        response.message = "Ya existe el numero de localizador"
        return response;
    }
    let serie = getSerie(req.serie,0)
    if (serie==true) {
      save_serie=req.serie
    }else{
    response.code = 400;
        response.message = "Ya existe el numero de serie"
        return response;
    }

    let ultima_senal = req.ultima_senal;
    try {
      let NewLocObj = record.create({
        type: "customrecord_conauto_localizadores",
        isDynamic: true,
      });
      try {
        NewLocObj.setValue({
          fieldId: "isinactive",
          value: isinactive,
        });
        NewLocObj.setValue({
          fieldId: "custrecord_localizador_solicitud",
          value: solicitud,
        });
        log.debug(" solicitud", solicitud);

        NewLocObj.setValue({
          fieldId: "custrecord_localizador_anio",
          value: anio,
        });
        log.debug(" anio", anio);
        NewLocObj.setValue({
          fieldId: "custrecord_localizador_morosidad",
          value: morosidad,
        });
        log.debug(" morosidad", morosidad);
        NewLocObj.setValue({
          fieldId: "custrecord_localizador_localizador",
          value: localizador!="false" ? localizador : "",
        });
        log.debug(" localizador", localizador);

        NewLocObj.setValue({
          fieldId: "custrecord_localizador_serie",
          value: save_serie,
        });

        NewLocObj.setValue({
          fieldId: "custrecord_localizador_ultima_senal",
          value: ultima_senal,
        });
        log.debug(" ultima_senal", ultima_senal);
      } catch (error) {
        log.error("Error al cargar un campo de localizador ", error);
        response.code = 400;
        response.message = error.message;
        return response;
      }
      try {
        let idLocation=NewLocObj.save({
        });
        response.code = 200;
        response.message = "exito"
        response.result.push({idLocation})
      } catch (error) {
        log.error("Error al guardar localizador", error);
        response.code = 400;
        response.message = "Error al guardar localizador " + error.message;
        return response;
      }
    } catch (error) {
      log.error("Error al crear localizador", error);
      response.code = 400;
      response.message = "Error al crear localizador " + error.message;
      return response;
    }
    return response;

    /* let unidad =requestBody.unidad
            let ultimasenal =requestBody.ultimasenal
            let fehcaultimaseñal =requestBody.fehcaultimaseñal
            let no_localizador =requestBody.no_localizador
            let id_unidad=getidunidad(unidad)
            let id_locsolicitud=getidlocalizador(id_unidad)
            return 'post' */
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
  function getLocalizador(localizador,idloc) {

    let numlocalizadorid;
    try {
    //buscar si existe
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
    if (searchResultCount==0) {
          //Si no existe crear y pasar el id
      log.debug( "Se crea lozalizador")
      let newlocobj=record.create({
        type: "customlist_conauto_n_localizador",
        isDynamic: true,
      })
      newlocobj.setValue({
        fieldId: "name",
        value: localizador,
      })
      let idlocalizador=newlocobj.save()

    return idlocalizador   
        
    }else{
      log.debug( "Se busca localizador")
      customerSearchObj.run().each(function (result) {
        //Si existe tomar el id
        numlocalizadorid = result.getValue(search_id);
        return true;
      }); 


    var customrecord_conauto_localizadoresSearchObj = search.create({
      type: "customrecord_conauto_localizadores",
      filters:
      [
        ["custrecord_localizador_localizador","is",numlocalizadorid]
      ],
      columns:
      [
        idloc_search=search.createColumn({name: "internalid", label: "ID interno"})
      ]
    });
    var searchResultCount = customrecord_conauto_localizadoresSearchObj.runPaged().count;
    if (searchResultCount==0) {
      //si nadie usa es id, devolverlo
      return numlocalizadorid
    }else if (searchResultCount==1) {
      let localizadorid
      customrecord_conauto_localizadoresSearchObj.run().each(function (result) {
        localizadorid = result.getValue(idloc_search);
        log.debug( "localizador id", localizadorid)
        return true;
      }); 
        return localizadorid==idloc?numlocalizadorid:false
    }else{
      //si usan el id, devolver false para evitar que se cree
      return false
    }}
    } catch (error) {
      localizadorid = false;
      log.debug("Error al traer clienteId ", error.message);
      return localizadorid;
    }
  }

  function getSerie(serie,idloc) {
    let serie_value;
    log.debug("Entra al fun serie ", serie);
    try {
      
      var customrecord_conauto_localizadoresSearchObj = search.create({
        type: "customrecord_conauto_localizadores",
        filters:
        [
          ["custrecord_localizador_serie","is",serie]
        ],
        columns:
        [
          search_id=search.createColumn({name: "internalid", label: "ID interno"})
        ]
      });
      var searchResultCount = customrecord_conauto_localizadoresSearchObj.runPaged().count;
      if (searchResultCount==1) {
        let localizadorid
        customrecord_conauto_localizadoresSearchObj.run().each(function (result) {
          //Si existe tomar el id
          localizadorid = result.getValue(search_id);
          return true;
        }); 
        log.debug( "Searching",idloc+'---'+localizadorid )
        if (idloc==localizadorid) {
          serie_value=true
        }else{
          serie_value=false
        }
      }else if(searchResultCount==0){
        serie_value=true
      }
      else if(searchResultCount>1){
        serie_value=false
      }

      return serie_value 
    } catch (error) {
      serie_value = false;
      log.debug("Error al traer clienteId ", error.message);
      return serie_value;
    }
  }

  return { get, put, post, delete: doDelete };
});
