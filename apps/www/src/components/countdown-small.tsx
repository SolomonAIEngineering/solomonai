"use client";

import { useEffect, useState } from "react";

export function CountdownSmall() {
  const countDownDate = new Date("2024-06-26");

  const getTimeDifference = (countDownTime) => {
    const currentTime = new Date().getTime();
    const timeDiffrence = countDownTime - currentTime;
    const days =
      Math.floor(timeDiffrence / (24 * 60 * 60 * 1000)) >= 10
        ? Math.floor(timeDiffrence / (24 * 60 * 60 * 1000))
        : `0${Math.floor(timeDiffrence / (24 * 60 * 60 * 1000))}`;
    const hours =
      Math.floor((timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60)) >=
      10
        ? Math.floor((timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60))
        : `0${Math.floor(
            (timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60),
          )}`;
    const minutes =
      Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60)) >= 10
        ? Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60))
        : `0${Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60))}`;
    const seconds =
      Math.floor((timeDiffrence % (60 * 1000)) / 1000) >= 10
        ? Math.floor((timeDiffrence % (60 * 1000)) / 1000)
        : `0${Math.floor((timeDiffrence % (60 * 1000)) / 1000)}`;

    if (timeDiffrence < 0) {
      clearInterval();

      return {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      };
    }

    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    };
  };

  const [countDownTime, setCountDownTIme] = useState(
    getTimeDifference(countDownDate),
  );

  useEffect(() => {
    setInterval(() => {
      setCountDownTIme(getTimeDifference(countDownDate.getTime()));
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="flex justify-center gap-2">
        <div className="relative flex flex-col">
          <div className="flex h-6 w-6 items-center justify-between">
            <div className="relative !-left-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-base font-medium">{countDownTime?.days}</span>
            <div className="relative -right-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </div>
          <span className="text-center text-[9px] text-[#707070]">
            {countDownTime?.days === 1 ? "Day" : "Days"}
          </span>
        </div>
        <div className="relative flex flex-col">
          <div className="flex h-6 w-6 items-center justify-between">
            <div className="relative !-left-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-base font-medium">
              {countDownTime?.hours}
            </span>
            <div className="relative -right-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </div>
          <span className="text-center text-[9px] text-[#707070]">
            {countDownTime?.hours === 1 ? "Hour" : "Hours"}
          </span>
        </div>
        <div className="relative flex flex-col">
          <div className="flex h-6 w-6 items-center justify-between">
            <div className="relative !-left-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-base font-medium">
              {countDownTime?.minutes}
            </span>
            <div className="relative -right-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </div>
          <span className="text-center text-[9px] text-[#707070]">
            {countDownTime?.minutes === 1 ? "Minute" : "Min"}
          </span>
        </div>
        <div className="relative flex flex-col">
          <div className="flex h-6 w-6 items-center justify-between">
            <div className="relative !-left-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-base font-medium">
              {countDownTime?.seconds}
            </span>
            <div className="relative -right-[6px] h-2.5 w-2.5 font-medium sm:h-3 sm:w-3" />
          </div>
          <span className="text-center text-[9px] text-[#707070]">
            {countDownTime?.seconds === 1 ? "Second" : "Sec"}
          </span>
        </div>
      </div>
    </div>
  );
}
