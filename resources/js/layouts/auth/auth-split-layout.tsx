import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
	children,
	title,
	description,
}: AuthLayoutProps) {

	return (
		<div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
			{/* Left side */}
			<div className="w-full lg:p-8">
				<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
					<Link
						href={home()}
						className="relative z-20 flex items-center justify-center lg:hidden"
					>
						<AppLogoIcon className="h-10 fill-current text-black sm:h-12" />
					</Link>
					<div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
						<AppLogoIcon className='h-10 sm:h-12' />
						<h1 className="text-xl font-medium">{title}</h1>
						<p className="text-sm text-balance text-muted-foreground">
							{description}
						</p>
					</div>
					{children}
				</div>
			</div>

			{/* Right side */}
			<div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
				<div className="absolute inset-0">
					<img
						src='/csav-school.jpg'
						alt="Authentication"
						className="w-full h-full object-cover"
					/>
					{/* Optional: Dark overlay for better text visibility */}
					<div className="absolute inset-0 bg-black/50"></div>
				</div>

				<div className="relative z-20">
					<Link
						href={home()}
						className="relative z-20 flex items-center text-lg font-medium"
					>
						<AppLogoIcon className="mr-2 size-8 fill-current text-white" />
						<span className="font-['DM_Serif_Display',serif] text-xl">Colegio de Sta. Ana de Victorias Inc.</span>
					</Link>
				</div>

				<div className="absolute bottom-0 right-0 z-20 p-10">
					<div className="text-right">
						<p className="font-['DM_Serif_Display',serif] text-4xl leading-[1.3] text-white tracking-[-0.02em] mb-4">
							Track goals,<br />
							drive <em className="italic text-secondary">impact.</em>
						</p>
						<div className="flex gap-6 mt-6 flex-wrap justify-end">
							<div className="flex flex-col items-end">
								<span className="font-['DM_Serif_Display',serif] text-2xl text-secondary leading-[1.2]">17</span>
								<span className="text-[0.7rem] text-white/45 uppercase tracking-[0.06em]">SDG Goals</span>
							</div>
							<div className="flex flex-col items-end">
								<span className="font-['DM_Serif_Display',serif] text-2xl text-secondary leading-[1.2]">100%</span>
								<span className="text-[0.7rem] text-white/45 uppercase tracking-[0.06em]">Compliance</span>
							</div>
							<div className="flex flex-col items-end">
								<span className="font-['DM_Serif_Display',serif] text-2xl text-secondary leading-[1.2]">∞</span>
								<span className="text-[0.7rem] text-white/45 uppercase tracking-[0.06em]">Impact</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
