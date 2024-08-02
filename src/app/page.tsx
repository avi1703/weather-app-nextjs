"use client";

import Container from "@/components/Container";
import ForecastWeatherDetail from "@/components/ForecastWeatherDetail";
import Navbar from "@/components/Navbar";
import WeatherDetails from "@/components/WeatherDetails";
import WeatherIcon from "@/components/WeatherIcon";
import { convertKelvinToCelsius } from "@/utils/convertKelvinToCelsius";
import { convertWindSpeed } from "@/utils/convertWindSpeed";
import { getDayOrNightIcon } from "@/utils/getDayOrNightIcon";
import { metersToKilometers } from "@/utils/metersToKilometers";
import axios from "axios";
import { format, fromUnixTime, parseISO } from "date-fns";
import Image from "next/image";
import { useQuery } from "react-query";
import { loadingCityAtom, placeAtom } from "./atom";
import { useAtom } from "jotai";
import { useEffect } from "react";

interface WeatherDetail {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    sea_level: number;
    grnd_level: number;
    humidity: number;
    temp_kf: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  visibility: number;
  pop: number;
  sys: {
    pod: string;
  };
  dt_txt: string;
}

interface WeatherData {
  cod: string;
  message: number;
  cnt: number;
  list: WeatherDetail[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export default function Home() {
  const [place, setPlace] = useAtom(placeAtom);
  const [loadingCity] = useAtom(loadingCityAtom);

  const { isLoading, error, data, refetch } = useQuery<WeatherData>(
    "repoData",
    async () => {
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}&cnt=56`
      );
      console.log("API response visibility data:", data?.list.map((d: WeatherDetail) => d.visibility)); // Add this line
      return data;
    }
  );

  useEffect(() => {
    refetch();
  }, [place, refetch]);

  const firstData = data?.list[0];

  const uniqueDates = [
    ...new Set(
      data?.list.map(
        (entry) => new Date(entry.dt * 1000).toISOString().split("T")[0]
      )
    )
  ];

  const firstDataForEachDate = uniqueDates.map((date) => {
    return data?.list.find((entry: WeatherDetail) => {
      const entryDate = new Date(entry.dt * 1000).toISOString().split("T")[0];
      const entryTime = new Date(entry.dt * 1000).getHours();
      return entryDate === date && entryTime >= 6;
    });
  });

  if (isLoading)
    return (
      <div className="flex items-center min-h-screen justify-center">
        <p className="animate-bounce">Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center min-h-screen justify-center">
        {/* @ts-ignore */}
        <p className="text-red-400">{error.message}</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-4 bg-[#987284] min-h-screen ">
      <Navbar location={data?.city.name} />
      <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9  w-full  pb-10 pt-4 ">
        {loadingCity ? (
          <WeatherSkeleton />
        ) : (
          <>
            <section className="space-y-4 ">
              <div className="space-y-2">
                <h2 className="flex gap-1 text-2xl text-[#F1F1F2]  items-end ">
                  <p>{format(parseISO(firstData?.dt_txt ?? ""), "EEEE")}</p>
                  <p className="text-lg">
                    ({format(parseISO(firstData?.dt_txt ?? ""), "dd.MM.yyyy")})
                  </p>
                </h2>
                <Container className=" gap-10 px-6 items-center vsm:scale-90 md:scale-100">
                  <div className=" flex flex-col px-4 ">
                    <span className="text-5xl">
                      {convertKelvinToCelsius(firstData?.main.temp ?? 296.37)}°
                    </span>
                    <p className="text-xs space-x-1 whitespace-nowrap">
                      <span> Feels like</span>
                      <span>
                        {convertKelvinToCelsius(
                          firstData?.main.feels_like ?? 0
                        )}
                        °
                      </span>
                    </p>
                    <p className="text-xs space-x-2">
                      <span>
                        {convertKelvinToCelsius(firstData?.main.temp_min ?? 0)}
                        °↓{" "}
                      </span>
                      <span>
                        {" "}
                        {convertKelvinToCelsius(firstData?.main.temp_max ?? 0)}
                        °↑
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
                    {data?.list.map((d, i) => (
                      <div
                        key={i}
                        className="flex flex-col justify-between gap-2 items-center text-xs font-semibold "
                      >
                        <p className="whitespace-nowrap">
                          {format(parseISO(d.dt_txt), "h:mm a")}
                        </p>
                        <WeatherIcon
                          iconName={getDayOrNightIcon(
                            d.weather[0].icon,
                            d.dt_txt
                          )}
                        />
                        <p>{convertKelvinToCelsius(d?.main.temp ?? 0)}°</p>
                      </div>
                    ))}
                  </div>
                </Container>
              </div>
              <div className=" flex gap-4 vsm:scale-90 md:scale-100">
                <Container className="w-fit  justify-center flex-col px-4 items-center ">
                  <p className=" capitalize text-center">
                    {firstData?.weather[0].description}{" "}
                  </p>
                  <WeatherIcon
                    iconName={getDayOrNightIcon(
                      firstData?.weather[0].icon ?? "",
                      firstData?.dt_txt ?? ""
                    )}
                  />
                </Container>
                <Container className="bg-white  px-6 gap-4 justify-between overflow-x-auto">
                  <WeatherDetails
                    visibility={firstData?.visibility ? metersToKilometers(firstData.visibility) : 'N/A'}
                    airPressure={`${firstData?.main.pressure} hPa`}
                    humidity={`${firstData?.main.humidity}%`}
                    sunrise={format(fromUnixTime(data?.city.sunrise ?? 1702517657), "H:mm")}
                    sunset={format(fromUnixTime(data?.city.sunset ?? 1702517657), "H:mm")}
                    windSpeed={convertWindSpeed(firstData?.wind.speed ?? 1.64)}
                  />
                </Container>
              </div>
            </section>
            <section className="flex w-full flex-col gap-4 vsm:scale-90 md:scale-100 ">
              <p className="text-2xl text-[#F1F1F2]">Forecast (6 days)</p>
              {firstDataForEachDate.map((d: WeatherDetail | undefined, i) => (
                <ForecastWeatherDetail
                  key={i}
                  description={d?.weather[0].description ?? ""}
                  weatehrIcon={d?.weather[0].icon ?? "01d"}
                  date={d ? format(parseISO(d.dt_txt), "dd.MM") : ""}
                  day={d ? format(parseISO(d.dt_txt), "EEEE") : ""}
                  feels_like={d?.main.feels_like ?? 0}
                  temp={d?.main.temp ?? 0}
                  temp_max={d?.main.temp_max ?? 0}
                  temp_min={d?.main.temp_min ?? 0}
                  airPressure={`${d?.main.pressure} hPa `}
                  humidity={`${d?.main.humidity}% `}
                  sunrise={format(fromUnixTime(data?.city.sunrise ?? 1702517657), "H:mm")}
                  sunset={format(fromUnixTime(data?.city.sunset ?? 1702517657), "H:mm")}
                  visibility={`${metersToKilometers(d?.visibility ?? 0)} `}
                  windSpeed={`${convertWindSpeed(d?.wind.speed ?? 1.64)} `}
                />
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <section className="space-y-8 ">
      <div className="space-y-2 animate-pulse">
        <div className="flex gap-1 text-2xl  items-end ">
          <p className="bg-slate-300 text-transparent rounded-md">Loading</p>
          <p className="text-lg bg-slate-300 text-transparent rounded-md">
            {" "}
            Loading
          </p>
        </div>
        <Container className=" gap-10 px-6 items-center vsm:scale-90 md:scale-100">
          <div className=" flex flex-col px-4 ">
            <span className="text-5xl bg-slate-300 text-transparent rounded-md">
              0
            </span>
            <p className="text-xs space-x-1 whitespace-nowrap bg-slate-300 text-transparent rounded-md">
              <span> Feels like</span>
              <span>0</span>
            </p>
            <p className="text-xs space-x-2 bg-slate-300 text-transparent rounded-md">
              <span>0</span>
              <span>0</span>
            </p>
          </div>
          <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between gap-2 items-center text-xs font-semibold "
              >
                <p className="whitespace-nowrap bg-slate-300 text-transparent rounded-md">
                  0
                </p>
                <Image
                  src="/icons/01d.svg"
                  width={100}
                  height={100}
                  alt="weather icon"
                  className="w-8 h-8 md:w-12 md:h-12 object-contain bg-slate-300 text-transparent rounded-md"
                />
                <p className="bg-slate-300 text-transparent rounded-md">0</p>
              </div>
            ))}
          </div>
        </Container>
      </div>
      <div className=" flex gap-4 vsm:scale-90 md:scale-100">
        <Container className="w-fit  justify-center flex-col px-4 items-center ">
          <p className=" capitalize text-center bg-slate-300 text-transparent rounded-md">
            0
          </p>
          <Image
            src="/icons/01d.svg"
            width={100}
            height={100}
            alt="weather icon"
            className="w-16 h-16 md:w-24 md:h-24 object-contain bg-slate-300 text-transparent rounded-md"
          />
        </Container>
        <Container className="bg-yellow-300/80  px-6 gap-4 justify-between overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between gap-2 items-center text-xs font-semibold bg-slate-300 text-transparent rounded-md"
            >
              <p className="whitespace-nowrap bg-slate-300 text-transparent rounded-md">
                0
              </p>
              <Image
                src="/icons/01d.svg"
                width={100}
                height={100}
                alt="weather icon"
                className="w-8 h-8 md:w-12 md:h-12 object-contain bg-slate-300 text-transparent rounded-md"
              />
              <p className="bg-slate-300 text-transparent rounded-md">0</p>
            </div>
          ))}
        </Container>
      </div>
    </section>
  );
}
