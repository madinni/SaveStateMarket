import React, { useEffect, useRef, useState } from "react";
import FieldError from "./FieldError";

const inputClass = "w-full bg-noir-950 border border-noir-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan";
const selectClass = `${inputClass} disabled:cursor-not-allowed disabled:opacity-50`;
const BRAZILIAN_STATES = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
];

// Normaliza nomes de cidade/rua para comparação: sem acento, minúsculas, sem apóstrofo,
// hífen vira espaço e espaços repetidos são colapsados ("Pau-d'Arco" == "pau darco").
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’‘`´]/g, "")
    .replace(/[-‐–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function ShippingAddressFields({ register, setValue, watch, errors, prefix = "shipping_address", fieldPath = "shipping_address" }) {
  const addressError = errors?.shipping_address || errors;
  const postalCodePath = `${fieldPath}.postal_code`;
  const streetPath = `${fieldPath}.street`;
  const verifiedPath = `${fieldPath}.street_verified`;
  const neighborhoodPath = `${fieldPath}.neighborhood`;
  const cityPath = `${fieldPath}.city`;
  const statePath = `${fieldPath}.state`;
  const postalCode = watch(postalCodePath) || "";
  const street = watch(streetPath) || "";
  const city = watch(cityPath) || "";
  const state = String(watch(statePath) || "").toUpperCase();
  // Lista de municípios { id, nome } do IBGE e a UF a que ela pertence.
  const [cities, setCities] = useState([]);
  const [citiesUf, setCitiesUf] = useState("");
  const [citiesStatus, setCitiesStatus] = useState("idle");
  // Cidade vinda do ViaCEP aguardando a lista de municípios da UF carregar.
  const [pendingCepCity, setPendingCepCity] = useState(null);
  const [cityNotice, setCityNotice] = useState("");
  // Rua preenchida pelo CEP: já conta como confirmada e não depende da busca externa.
  const streetFromCepRef = useRef(false);
  // Cidade e rua informadas pelo último CEP consultado ({ uf, ibge, nome, street }). Servem para
  // invalidar a rua quando o usuário troca para outra cidade e reconfirmá-la se ele voltar.
  const cepCityRef = useRef(null);
  const [retryCities, setRetryCities] = useState(0);
  const [cepStatus, setCepStatus] = useState("");
  const [streetSearch, setStreetSearch] = useState(street);
  const [streetResults, setStreetResults] = useState([]);
  const [streetStatus, setStreetStatus] = useState("");
  const [isSearchingStreet, setIsSearchingStreet] = useState(false);
  const lastCepRef = useRef("");
  const lastStreetSearchRef = useRef(0);

  useEffect(() => {
    if (state && state !== watch(statePath)) {
      setValue(statePath, state, { shouldValidate: false });
    }
  }, [setValue, state, statePath, watch]);

  useEffect(() => {
    if (!state) {
      setCities([]);
      setCitiesUf("");
      setCitiesStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    setCitiesStatus("loading");
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível carregar os municípios.");
        return response.json();
      })
      .then((data) => {
        setCities(data.map((municipality) => ({ id: String(municipality.id), nome: municipality.nome })));
        setCitiesUf(state);
        setCitiesStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setCitiesStatus("error");
      });

    return () => controller.abort();
  }, [retryCities, state]);

  useEffect(() => {
    const digits = String(postalCode).replace(/\D/g, "");
    if (digits.length !== 8) {
      lastCepRef.current = "";
      return undefined;
    }
    if (lastCepRef.current === digits) return undefined;

    lastCepRef.current = digits;
    const controller = new AbortController();
    setCepStatus("Consultando CEP...");
    fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Falha na consulta do CEP.");
        return response.json();
      })
      .then((data) => {
        if (data.erro) {
          setCepStatus("CEP não encontrado. Confira os números informados.");
          return;
        }
        // A UF vem primeiro; a cidade só é escolhida quando os municípios dessa UF carregarem
        // (o select não aceita um valor que ainda não está entre as opções).
        const uf = String(data.uf || "").toUpperCase();
        setValue(statePath, uf, { shouldDirty: true, shouldValidate: true });
        setValue(cityPath, "", { shouldDirty: true });
        setPendingCepCity(uf ? { uf, ibge: String(data.ibge || ""), nome: data.localidade || "" } : null);
        setCityNotice("");
        setValue(neighborhoodPath, data.bairro || "", { shouldDirty: true, shouldValidate: true });
        setValue(streetPath, data.logradouro || "", { shouldDirty: true, shouldValidate: true });
        setValue(verifiedPath, Boolean(data.logradouro), { shouldDirty: true, shouldValidate: true });
        streetFromCepRef.current = Boolean(data.logradouro);
        cepCityRef.current = uf
          ? { uf, ibge: String(data.ibge || ""), nome: data.localidade || "", street: data.logradouro || "" }
          : null;
        setStreetSearch(data.logradouro || "");
        setStreetResults([]);
        setStreetStatus("");
        setCepStatus(data.logradouro ? "CEP confirmado pelo ViaCEP." : "CEP confirmado. Este CEP não informa a rua: pesquise a rua para confirmá-la.");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setCepStatus("Não foi possível consultar o CEP agora.");
      });

    return () => controller.abort();
  }, [postalCode, setValue, cityPath, neighborhoodPath, statePath, streetPath, verifiedPath]);

  // Quando os municípios da UF ficam prontos: aplica a cidade do CEP (pelo código IBGE, com
  // reserva pelo nome normalizado) ou reaplica a cidade já salva para o select exibi-la.
  useEffect(() => {
    if (citiesStatus !== "ready" || !state || citiesUf !== state) return;

    if (pendingCepCity) {
      if (pendingCepCity.uf !== state) {
        setPendingCepCity(null);
        return;
      }
      const match =
        cities.find((option) => pendingCepCity.ibge && option.id === pendingCepCity.ibge) ||
        cities.find((option) => normalize(option.nome) === normalize(pendingCepCity.nome));
      setPendingCepCity(null);
      if (match) {
        setValue(cityPath, match.nome, { shouldDirty: true, shouldValidate: true });
        setCityNotice("");
      } else {
        setValue(cityPath, "", { shouldDirty: true });
        setCityNotice("Não encontramos a cidade deste CEP na lista. Escolha a cidade abaixo.");
      }
      return;
    }

    const current = watch(cityPath);
    if (!current) return;
    const match = cities.find((option) => normalize(option.nome) === normalize(current));
    if (match) setValue(cityPath, match.nome, { shouldValidate: false });
  }, [cities, citiesStatus, citiesUf, cityPath, pendingCepCity, setValue, state, watch]);

  useEffect(() => {
    setStreetSearch(street);
  }, [street]);

  const invalidateStreet = () => {
    streetFromCepRef.current = false;
    setValue(verifiedPath, false, { shouldDirty: true, shouldValidate: true });
    setStreetResults([]);
    setStreetStatus("");
  };

  // A cidade escolhida à mão é a mesma do último CEP (pelo código IBGE ou pelo nome)?
  const isCepCity = (cityName) => {
    const cep = cepCityRef.current;
    if (!cep || !cityName || cep.uf !== state) return false;
    const option = cities.find((item) => item.nome === cityName);
    return Boolean((cep.ibge && option?.id === cep.ibge) || normalize(cityName) === normalize(cep.nome));
  };

  const handleCityChange = (event) => {
    const cityName = event.target.value;
    const cep = cepCityRef.current;
    if (isCepCity(cityName)) {
      setCityNotice("");
      // Voltou para a cidade do CEP com a rua do CEP ainda no campo: a rua volta a valer.
      if (cep.street && watch(streetPath) === cep.street) {
        setValue(verifiedPath, true, { shouldDirty: true, shouldValidate: true });
        streetFromCepRef.current = true;
        setStreetSearch(cep.street);
        setStreetResults([]);
        setStreetStatus("");
      }
      return;
    }
    invalidateStreet();
    setCityNotice(
      cep && cityName
        ? `A cidade escolhida é diferente da cidade do CEP (${cep.nome}). Pesquise a rua novamente para confirmá-la.`
        : "",
    );
  };

  const postalCodeRegistration = register(postalCodePath, {
    onChange: (event) => {
      const previousDigits = String(postalCode).replace(/\D/g, "");
      const nextDigits = String(event.target.value).replace(/\D/g, "");
      if (previousDigits && previousDigits !== nextDigits) {
        setValue(streetPath, "", { shouldDirty: true, shouldValidate: true });
        setValue(verifiedPath, false, { shouldDirty: true, shouldValidate: true });
        setValue(neighborhoodPath, "", { shouldDirty: true, shouldValidate: true });
        setValue(cityPath, "", { shouldDirty: true, shouldValidate: true });
        setValue(statePath, "", { shouldDirty: true, shouldValidate: true });
        streetFromCepRef.current = false;
        cepCityRef.current = null;
        setPendingCepCity(null);
        setCityNotice("");
        setCepStatus("");
      }
    },
  });

  const searchStreets = async () => {
    const query = streetSearch.trim();
    if (query.length < 3 || !city || !state) {
      setStreetStatus("Informe ao menos 3 caracteres e selecione UF e cidade.");
      return;
    }
    const elapsed = Date.now() - lastStreetSearchRef.current;
    if (elapsed < 1000) {
      setStreetStatus("Aguarde um segundo antes de pesquisar novamente.");
      return;
    }
    lastStreetSearchRef.current = Date.now();
    setIsSearchingStreet(true);
    setStreetStatus("");
    setStreetResults([]);
    try {
      const params = new URLSearchParams({
        street: query,
        city,
        state: BRAZILIAN_STATES.find(([uf]) => uf === state)?.[1] || state,
        country: "Brazil",
        countrycodes: "br",
        format: "jsonv2",
        addressdetails: "1",
        limit: "8",
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      if (!response.ok) throw new Error("Falha na busca de ruas.");
      const results = await response.json();
      const matchingStreets = results
        .filter((result) => result.address?.road)
        .filter((result) => {
          const resultCity = result.address.city || result.address.town || result.address.village || result.address.municipality;
          return !resultCity || normalize(resultCity) === normalize(city);
        });
      setStreetResults(matchingStreets);
      setStreetStatus(matchingStreets.length ? "Selecione o logradouro confirmado." : "Nenhuma rua encontrada. Confira a busca ou o CEP.");
    } catch {
      setStreetStatus("Não foi possível consultar o OpenStreetMap agora.");
    } finally {
      setIsSearchingStreet(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${prefix}-postal-code`} className="mb-1 block text-[10px] text-slate-400">CEP</label>
        <input id={`${prefix}-postal-code`} autoComplete="postal-code" inputMode="numeric" maxLength={9} {...postalCodeRegistration} className={inputClass} />
        <FieldError error={addressError?.postal_code} />
        {cepStatus && <p role="status" className="mt-1 text-[10px] text-slate-400">{cepStatus}</p>}
      </div>
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <div>
          <label htmlFor={`${prefix}-street-search`} className="mb-1 block text-[10px] text-slate-400">PESQUISAR RUA / AVENIDA</label>
          <div className="flex gap-2">
            <input id={`${prefix}-street-search`} autoComplete="address-line1" value={streetSearch}
              onChange={(event) => {
                setStreetSearch(event.target.value);
                if (watch(verifiedPath)) invalidateStreet();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  searchStreets();
                }
              }}
              className={inputClass} />
            <button type="button" onClick={searchStreets} disabled={isSearchingStreet || !city || !state}
              aria-label="Pesquisar rua" title="Pesquisar rua"
              className="shrink-0 border border-neon-cyan px-3 text-neon-cyan disabled:opacity-50">
              {isSearchingStreet ? "..." : "BUSCAR"}
            </button>
          </div>
          <input type="hidden" {...register(streetPath)} />
          <input type="hidden" {...register(verifiedPath)} />
          {streetResults.length > 0 && (
            <ul className="mt-1 max-h-40 overflow-y-auto border border-noir-700 bg-noir-950" aria-label="Ruas encontradas">
              {streetResults.map((result) => (
                <li key={result.place_id}>
                  <button type="button" onClick={() => {
                    setValue(streetPath, result.address.road, { shouldDirty: true, shouldValidate: true });
                    setValue(verifiedPath, true, { shouldDirty: true, shouldValidate: true });
                    streetFromCepRef.current = false;
                    const neighborhood = result.address.suburb || result.address.neighbourhood || result.address.quarter;
                    if (neighborhood) setValue(neighborhoodPath, neighborhood, { shouldDirty: true, shouldValidate: true });
                    setStreetResults([]);
                    setStreetStatus("Rua confirmada pelo OpenStreetMap.");
                  }} className="w-full px-3 py-2 text-left text-[10px] text-white hover:bg-noir-800">
                    {result.address.road}{result.address.suburb ? ` - ${result.address.suburb}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {streetStatus && <p role="status" className="mt-1 text-[10px] text-slate-400">{streetStatus}</p>}
          <FieldError error={addressError?.street} />
          <FieldError error={addressError?.street_verified} />
        </div>
        <div>
          <label htmlFor={`${prefix}-number`} className="mb-1 block text-[10px] text-slate-400">NÚMERO</label>
          <input id={`${prefix}-number`} autoComplete="off" {...register(`${fieldPath}.number`)} className={inputClass} />
          <FieldError error={addressError?.number} />
        </div>
      </div>
      <div>
        <label htmlFor={`${prefix}-complement`} className="mb-1 block text-[10px] text-slate-400">COMPLEMENTO (OPCIONAL)</label>
        <input id={`${prefix}-complement`} autoComplete="address-line2" {...register(`${fieldPath}.complement`)} className={inputClass} />
        <FieldError error={addressError?.complement} />
      </div>
      <div>
        <label htmlFor={`${prefix}-neighborhood`} className="mb-1 block text-[10px] text-slate-400">BAIRRO</label>
        <input id={`${prefix}-neighborhood`} autoComplete="address-level3" {...register(neighborhoodPath)} className={inputClass} />
        <FieldError error={addressError?.neighborhood} />
      </div>
      <div className="grid grid-cols-[1fr_4rem] gap-2">
        <div>
          <label htmlFor={`${prefix}-city`} className="mb-1 block text-[10px] text-slate-400">CIDADE</label>
          <select id={`${prefix}-city`} autoComplete="address-level2" disabled={!state || citiesStatus !== "ready"}
            {...register(cityPath, { onChange: handleCityChange })} className={selectClass}>
            <option value="">{citiesStatus === "loading" ? "CARREGANDO CIDADES..." : "SELECIONE A CIDADE"}</option>
            {cities.map((option) => <option key={option.id} value={option.nome}>{option.nome}</option>)}
          </select>
          {cityNotice && <p role="status" className="mt-1 text-xs text-neon-amber">{cityNotice}</p>}
          {citiesStatus === "error" && (
            <button type="button" onClick={() => setRetryCities((attempt) => attempt + 1)} className="mt-1 text-[10px] text-neon-pink">
              Não foi possível carregar. Tentar novamente
            </button>
          )}
          <FieldError error={addressError?.city} />
        </div>
        <div>
          <label htmlFor={`${prefix}-state`} className="mb-1 block text-[10px] text-slate-400">UF</label>
          <select id={`${prefix}-state`} autoComplete="address-level1" {...register(statePath, {
            onChange: () => {
              setValue(cityPath, "", { shouldDirty: true, shouldValidate: true });
              setPendingCepCity(null);
              setCityNotice("");
              invalidateStreet();
            },
          })} className={selectClass}>
            <option value="">UF</option>
            {BRAZILIAN_STATES.map(([uf]) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <FieldError error={addressError?.state} />
        </div>
      </div>
      <p className="text-[9px] text-slate-500">
        Municípios: IBGE · CEP: ViaCEP · Ruas: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a>
      </p>
    </div>
  );
}