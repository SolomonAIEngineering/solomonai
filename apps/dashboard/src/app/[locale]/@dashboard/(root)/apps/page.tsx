import { AppDetails } from "@/components/app-details";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apps | Midday",
};

const apps = [
  {
    id: "linear",
    name: "Linear",
    description:
      "Our integration with Linear from Midday is a powerful collaboration tool that seamlessly connects Linear, a popular project management and issue tracking platform, with Midday. Midday will create tasks in Linear about everything related to your financial tasks.",
    logo: (
      <svg
        width="60"
        height="60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#a)">
          <path
            d="M.735 36.914c-.133-.57.545-.928.958-.514l21.908 21.907c.413.413.054 1.091-.515.958C12.031 56.67 3.33 47.969.736 36.914Zm-.734-8.78c-.01.17.053.335.174.456L31.41 59.825c.12.12.287.185.456.174a30.042 30.042 0 0 0 4.178-.556.583.583 0 0 0 .287-.989L1.546 23.67a.583.583 0 0 0-.99.287 30.04 30.04 0 0 0-.555 4.177Zm2.526-10.31a.593.593 0 0 0 .124.66l38.866 38.865a.593.593 0 0 0 .66.124 29.941 29.941 0 0 0 3.111-1.61.589.589 0 0 0 .11-.924L5.061 14.602a.589.589 0 0 0-.924.11 29.949 29.949 0 0 0-1.61 3.111Zm5.068-6.98a.591.591 0 0 1-.026-.812C13.068 3.876 21.067 0 29.97 0 46.556 0 60 13.444 60 30.029c0 8.904-3.876 16.903-10.032 22.402a.592.592 0 0 1-.813-.026l-41.56-41.56Z"
            fill="#fff"
          />
        </g>
        <defs>
          <clipPath id="a">
            <path fill="#fff" d="M0 0h60v60H0z" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    id: "notion",
    name: "Notion",
    description:
      "Our Integration with Notion from Midday is a game-changer for teams seeking a seamless connection between project management and collaborative note-taking. With this integration, you can effortlessly link your Notion pages and databases to your Midday workspace.",
    logo: (
      <svg
        width="60"
        height="60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#a)">
          <path
            d="M3.61 2.588 36.81.136c4.078-.35 5.126-.114 7.69 1.75l10.598 7.466c1.748 1.284 2.33 1.633 2.33 3.031V53.33c0 2.566-.932 4.084-4.194 4.316L14.68 59.98c-2.448.116-3.614-.234-4.896-1.868L1.98 47.964C.58 46.096 0 44.698 0 43.064V6.668C0 4.57.932 2.82 3.61 2.588Z"
            fill="#101010"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M36.81.136 3.61 2.588C.932 2.82 0 4.57 0 6.668v36.396c0 1.634.58 3.032 1.98 4.9l7.804 10.148c1.282 1.634 2.448 1.984 4.896 1.868l38.554-2.334c3.26-.233 4.194-1.75 4.194-4.316V12.384c0-1.326-.523-1.708-2.065-2.84L44.5 1.886c-2.564-1.864-3.612-2.1-7.69-1.75ZM15.552 11.714c-3.148.212-3.862.26-5.65-1.194L5.356 6.904c-.462-.468-.23-1.052.934-1.168l31.916-2.332c2.68-.234 4.076.7 5.124 1.516l5.474 3.966c.234.118.816.816.116.816l-32.96 1.984-.408.028Zm-3.67 41.266V18.22c0-1.518.466-2.218 1.862-2.336L51.6 13.668c1.284-.116 1.864.7 1.864 2.216v34.528c0 1.518-.234 2.802-2.33 2.918l-36.226 2.1c-2.096.116-3.026-.582-3.026-2.45Zm35.76-32.896c.232 1.05 0 2.1-1.05 2.22l-1.746.346v25.664c-1.516.816-2.912 1.282-4.078 1.282-1.865 0-2.33-.584-3.726-2.332L25.624 29.3v17.38l3.612.818s0 2.1-2.915 2.1l-8.034.466c-.234-.468 0-1.634.815-1.866l2.098-.582v-22.98l-2.912-.236c-.234-1.05.348-2.566 1.98-2.684l8.62-.58 11.88 18.196V23.234l-3.028-.348c-.234-1.285.698-2.22 1.862-2.334l8.04-.468Z"
            fill="#fff"
          />
        </g>
        <defs>
          <clipPath id="a">
            <path fill="#fff" d="M0 0h60v60H0z" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    id: "cal",
    name: "Cal.com",
    description:
      "Our Integration with Cal.com  from Midday is a dynamic collaboration tool that brings together two essential elements for productivity and time management. With this integration, you can synchronize your Cal Calendar with your Midday workspace seamlessly. This ensures that your time reporting is accessible from Cal.com",
    logo: (
      <svg
        width="101"
        height="22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.058 20.817C4.321 20.817 0 16.277 0 10.67 0 5.046 4.1.468 10.058.468c3.163 0 5.351.971 7.061 3.195l-2.758 2.299c-1.159-1.234-2.556-1.85-4.303-1.85-3.88 0-6.013 2.97-6.013 6.558 0 3.588 2.336 6.503 6.013 6.503 1.729 0 3.2-.616 4.358-1.85l2.721 2.392c-1.636 2.13-3.88 3.102-7.079 3.102ZM29.016 5.886h3.714v14.575h-3.714v-2.13c-.772 1.514-2.06 2.523-4.523 2.523-3.935 0-7.08-3.42-7.08-7.624 0-4.205 3.145-7.624 7.08-7.624 2.445 0 3.75 1.009 4.523 2.522V5.886Zm.11 7.344c0-2.28-1.563-4.167-4.027-4.167-2.372 0-3.916 1.906-3.916 4.167 0 2.205 1.544 4.167 3.916 4.167 2.446 0 4.027-1.906 4.027-4.167ZM35.36 0h3.714v20.443H35.36V0ZM40.729 18.518c0-1.196.956-2.205 2.262-2.205a2.18 2.18 0 0 1 2.225 2.205c0 1.233-.938 2.242-2.225 2.242a2.231 2.231 0 0 1-2.262-2.242ZM59.43 18.107c-1.38 1.681-3.476 2.747-5.958 2.747-4.432 0-7.686-3.42-7.686-7.624 0-4.205 3.254-7.624 7.686-7.624 2.39 0 4.468 1.009 5.847 2.597l-2.868 2.41c-.718-.896-1.655-1.569-2.98-1.569-2.371 0-3.916 1.906-3.916 4.167s1.545 4.167 3.917 4.167c1.434 0 2.427-.747 3.162-1.757l2.795 2.486ZM59.742 13.23c0-4.205 3.255-7.624 7.686-7.624 4.432 0 7.686 3.42 7.686 7.624s-3.254 7.624-7.686 7.624c-4.431-.02-7.686-3.42-7.686-7.624Zm11.603 0c0-2.28-1.545-4.167-3.917-4.167-2.372-.019-3.916 1.887-3.916 4.167 0 2.26 1.544 4.167 3.916 4.167s3.917-1.906 3.917-4.167ZM100.232 11.548v8.895h-3.714v-7.98c0-2.522-1.177-3.606-2.942-3.606-1.655 0-2.832.823-2.832 3.607v7.979H87.03v-7.98c0-2.522-1.195-3.606-2.942-3.606-1.655 0-3.108.823-3.108 3.607v7.979h-3.714V5.868h3.714v2.018c.773-1.57 2.17-2.355 4.322-2.355 2.04 0 3.75 1.01 4.688 2.71.938-1.738 2.317-2.71 4.818-2.71 3.052.019 5.424 2.336 5.424 6.017Z"
          fill="#FAFAFA"
        />
      </svg>
    ),
  },
  {
    id: "fortnox",
    name: "Fortnox",
    active: true,
    description:
      "Integration with Fortnox is a powerful solution that allows seamless connectivity between Midday and Fortnox, a popular cloud-based accounting and financial management software. This integration streamlines financial processes by enabling data exchange, synchronization, and automation between Midday and Fortnox.",
    logo: (
      <svg
        width="100"
        height="22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.4 1.43H6.216C2.608 1.43.16 3.878.16 7.486v12.98c0 .374.207.581.58.581h2.883c.373 0 .58-.207.58-.58v-5.392h7.216c.374 0 .58-.207.58-.58v-2.758c0-.373-.206-.58-.58-.58H4.184V7.381c0-1.203.808-2.012 2.011-2.012H11.4c.373 0 .58-.207.58-.58V2.01c0-.373-.207-.58-.58-.58ZM21.331 4.894c-4.769 0-8.19 3.607-8.19 8.231s3.442 8.232 8.19 8.232c4.749 0 8.19-3.608 8.19-8.232 0-4.624-3.42-8.231-8.19-8.231Zm0 12.586c-2.446 0-4.25-1.825-4.25-4.355 0-2.53 1.783-4.354 4.25-4.354 2.468 0 4.251 1.825 4.251 4.354 0 2.53-1.783 4.355-4.25 4.355ZM49.158 5.184h-4.914V1.43c0-.374-.208-.58-.58-.58H40.78c-.373 0-.58.206-.58.58v3.753h-3.463c-3.587 0-6.055 2.446-6.055 6.054v9.228c0 .373.207.58.58.58h2.883c.373 0 .58-.207.58-.58v-9.352c0-1.203.81-2.011 2.012-2.011H40.2v5.889c0 3.607 2.447 6.054 6.055 6.054h2.882c.374 0 .581-.207.581-.58v-2.758c0-.373-.207-.58-.58-.58h-2.862c-1.203 0-2.011-.81-2.011-2.012V9.103h4.914c.373 0 .58-.208.58-.58V5.763c-.02-.394-.228-.58-.6-.58ZM58.116 4.894c-4.355 0-7.216 2.799-7.216 7.07v8.522c0 .374.207.581.58.581h2.883c.373 0 .58-.207.58-.58v-8.523c0-1.928 1.265-3.172 3.173-3.152 1.907-.02 3.172 1.203 3.172 3.152v8.522c0 .374.208.581.58.581h2.883c.373 0 .58-.207.58-.58v-8.523c0-4.271-2.86-7.07-7.215-7.07ZM74.683 4.894c-4.769 0-8.19 3.607-8.19 8.231s3.442 8.232 8.19 8.232c4.77 0 8.19-3.608 8.19-8.232 0-4.624-3.442-8.231-8.19-8.231Zm0 12.586c-2.447 0-4.25-1.825-4.25-4.355 0-2.53 1.783-4.354 4.25-4.354 2.447 0 4.25 1.825 4.25 4.354 0 2.53-1.803 4.355-4.25 4.355Z"
          fill="#fff"
        />
        <path
          d="m93.76 13.084 5.1-5.1c.27-.27.27-.54 0-.81l-2.011-2.01c-.27-.27-.54-.27-.809 0l-5.1 5.1-5.102-5.1c-.269-.27-.539-.27-.808 0l-2.011 2.01c-.27.27-.27.54 0 .81l5.1 5.1-5.142 5.1c-.27.27-.27.54 0 .81l2.011 2.01c.27.27.54.27.81 0l5.1-5.1 5.1 5.1c.27.27.54.27.81 0l2.01-2.01c.27-.27.27-.54 0-.81l-5.059-5.1Z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    id: "visma",
    name: "Visma",
    active: true,
    description:
      "Integration with Visma offers a comprehensive solution for connecting Midday with Visma's suite of financial and administrative software. This integration facilitates the exchange of data and automates key financial processes, enhancing the efficiency of your operations and ensuring accurate financial management.",
    logo: (
      <svg
        width="119"
        height="22"
        viewBox="0 0 119 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_466_1695)">
          <path
            d="M12.1319 0C18.5624 0.545608 25.6579 3.80657 29.703 8.45058C34.885 14.3838 33.1035 20.322 25.7188 21.7076C18.334 23.0957 8.14765 19.4084 2.96564 13.4702C-0.998262 8.92767 -0.886603 4.38517 2.69157 1.87791L23.2217 17.0407L12.1319 0Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M108.385 0.0480957L102.396 21.6439H106.862L109.476 11.3409C109.806 10.0974 109.907 8.85416 110.136 7.61068H110.186C110.44 8.844 110.592 10.0744 110.973 11.3052L113.539 21.6439H118.104L111.861 0.0480957H108.385ZM113.539 21.6439H113.511L113.546 21.6722L113.539 21.6439ZM45.3835 0.0758519L45.384 0.0788261H45.386L45.3835 0.0758519ZM45.384 0.0788261H40.8027L47.0459 21.6747H50.5402L56.5241 0.0837823H52.0579L49.4537 10.3868C49.1086 11.6506 49.0224 12.8816 48.794 14.1428H48.7355C48.4792 12.9095 48.3348 11.6786 47.9643 10.4478L45.384 0.0788261ZM59.7315 0.0758519V21.6722H64.0025V0.0758519H59.7315ZM74.5801 0.0758519C74.5568 0.0922506 74.5351 0.112231 74.5122 0.129382H74.5801V0.0758519ZM74.5122 0.129382H69.4739C69.4739 0.129382 69.1062 0.814762 68.9337 1.2208C67.1573 5.50953 68.8322 8.65609 70.4563 11.676C71.8038 14.1883 73.1966 16.8022 72.0166 19.6445C71.6664 20.4819 71.032 21.2179 70.4484 21.6747H75.5872C75.5872 21.6747 75.8717 21.1163 75.9986 20.8117C77.7167 16.6651 76.803 13.7541 74.5013 9.8054C74.3515 9.53387 74.1916 9.25999 74.0393 8.99353C72.9811 7.16892 71.7882 5.10082 72.9048 2.41084C73.2734 1.52129 73.8104 0.653678 74.5122 0.129382ZM88.1236 0.0758519L88.1281 0.104104H88.1643L88.1236 0.0758519ZM88.1281 0.104104H82.5307L80.6275 21.6999H85.2206L85.8298 6.14356H85.8853V6.54999L86.601 11.3459L88.6946 21.6747H91.9837L93.8206 11.4475L94.5061 6.14356H94.5645L95.597 21.6747H99.9775L97.7134 0.0788259H91.9837L90.2678 12.8229H90.2123L88.1281 0.104104Z"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_466_1695">
            <rect width="118.104" height="22" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
];

export default function Apps() {
  return (
    <div className="max-w-[1200px] mt-8">
      <div className="divide-y">
        {apps.map((app) => {
          return <AppDetails key={app.id} {...app} />;
        })}
      </div>
    </div>
  );
}
